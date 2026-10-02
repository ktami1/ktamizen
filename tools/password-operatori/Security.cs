// Sicurezza di Password Operatori: utenti, hash delle password, registro a catena, permessi delle cartelle.
//
// Principi:
// - Il file del gestionale (M_CTL*.DAT) si apre SOLO in lettura (FileAccess.Read). Il programma non scrive mai li'.
// - Il programma scrive solo in %ProgramData%\PasswordOperatori (utenti e registro), mai altrove.
// - Nessuna connessione di rete: non c'e' codice di rete in tutto il programma.
// - Password degli utenti: PBKDF2-HMAC-SHA256 con sale casuale, mai salvate in chiaro.
// - Registro: ogni riga contiene l'hash della precedente; cancellare o modificare una riga rompe la catena.
//   I permessi NTFS consentono agli utenti normali solo di aggiungere righe, non di modificarle o cancellarle.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Security.AccessControl;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;
using System.Windows.Forms;

namespace PasswordOperatori
{
    static class Paths
    {
        public static string Dir
        {
            get { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "PasswordOperatori"); }
        }

        public static string Users { get { return Path.Combine(Dir, "users.dat"); } }
        public static string Audit { get { return Path.Combine(Dir, "audit.log"); } }
    }

    // ---------------------------------------------------------------- crittografia

    static class Crypto
    {
        public const int Iterations = 200000;
        static readonly UTF8Encoding Utf8 = new UTF8Encoding(false);

        // PBKDF2-HMAC-SHA256 (RFC 8018), un blocco da 32 byte.
        public static byte[] Pbkdf2(string password, byte[] salt, int iterations)
        {
            using (HMACSHA256 h = new HMACSHA256(Utf8.GetBytes(password)))
            {
                byte[] block = new byte[salt.Length + 4];
                Buffer.BlockCopy(salt, 0, block, 0, salt.Length);
                block[block.Length - 1] = 1;
                byte[] u = h.ComputeHash(block);
                byte[] t = (byte[])u.Clone();
                for (int i = 1; i < iterations; i++)
                {
                    u = h.ComputeHash(u);
                    for (int k = 0; k < t.Length; k++) t[k] ^= u[k];
                }
                return t;
            }
        }

        public static byte[] Random(int n)
        {
            byte[] b = new byte[n];
            using (RNGCryptoServiceProvider r = new RNGCryptoServiceProvider()) r.GetBytes(b);
            return b;
        }

        // Confronto a tempo costante.
        public static bool SlowEquals(byte[] a, byte[] b)
        {
            uint diff = (uint)a.Length ^ (uint)b.Length;
            for (int i = 0; i < a.Length && i < b.Length; i++) diff |= (uint)(a[i] ^ b[i]);
            return diff == 0;
        }

        public static string Sha256Hex(byte[] data)
        {
            using (SHA256 sha = SHA256.Create())
            {
                byte[] h = sha.ComputeHash(data);
                StringBuilder sb = new StringBuilder(h.Length * 2);
                foreach (byte x in h) sb.Append(x.ToString("x2"));
                return sb.ToString();
            }
        }

        public static string Sha256Hex(string s) { return Sha256Hex(Utf8.GetBytes(s)); }

        public static string FileSha256(string path)
        {
            using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            using (SHA256 sha = SHA256.Create())
            {
                byte[] h = sha.ComputeHash(fs);
                StringBuilder sb = new StringBuilder(h.Length * 2);
                foreach (byte x in h) sb.Append(x.ToString("X2"));
                return sb.ToString();
            }
        }
    }

    // ---------------------------------------------------------------- utenti

    class AppUser
    {
        public string Name;
        public bool Admin;
        public int Iterations;
        public byte[] Salt;
        public byte[] Hash;
        public string Created;

        public string Role { get { return Admin ? "Amministratore" : "Responsabile"; } }
    }

    static class Session
    {
        public static AppUser User;
    }

    static class UserStore
    {
        public static bool Exists { get { return File.Exists(Paths.Users); } }

        // Formato riga: v1|nome|ruolo|iterazioni|sale|hash|creato
        public static List<AppUser> Load()
        {
            List<AppUser> list = new List<AppUser>();
            if (!File.Exists(Paths.Users)) return list;
            foreach (string line in File.ReadAllLines(Paths.Users, Encoding.UTF8))
            {
                string[] p = line.Split('|');
                if (p.Length != 7 || p[0] != "v1") continue;
                try
                {
                    AppUser u = new AppUser();
                    u.Name = p[1];
                    u.Admin = p[2] == "admin";
                    u.Iterations = int.Parse(p[3], CultureInfo.InvariantCulture);
                    u.Salt = Convert.FromBase64String(p[4]);
                    u.Hash = Convert.FromBase64String(p[5]);
                    u.Created = p[6];
                    if (u.Iterations >= 10000 && u.Salt.Length >= 16 && u.Hash.Length == 32) list.Add(u);
                }
                catch { }
            }
            return list;
        }

        // Scrittura atomica: file temporaneo e poi sostituzione.
        public static void Save(List<AppUser> users)
        {
            Directory.CreateDirectory(Paths.Dir);
            List<string> lines = new List<string>();
            foreach (AppUser u in users)
            {
                lines.Add(string.Join("|", new string[] {
                    "v1", u.Name, u.Admin ? "admin" : "responsabile",
                    u.Iterations.ToString(CultureInfo.InvariantCulture),
                    Convert.ToBase64String(u.Salt), Convert.ToBase64String(u.Hash), u.Created }));
            }
            string tmp = Paths.Users + ".tmp";
            File.WriteAllLines(tmp, lines.ToArray(), new UTF8Encoding(false));
            if (File.Exists(Paths.Users))
            {
                try { File.Replace(tmp, Paths.Users, null); }
                catch (PlatformNotSupportedException) { File.Delete(Paths.Users); File.Move(tmp, Paths.Users); }
            }
            else File.Move(tmp, Paths.Users);
        }

        public static AppUser Create(string name, string password, bool admin)
        {
            AppUser u = new AppUser();
            u.Name = name.Trim().ToLowerInvariant();
            u.Admin = admin;
            u.Iterations = Crypto.Iterations;
            u.Salt = Crypto.Random(16);
            u.Hash = Crypto.Pbkdf2(password, u.Salt, u.Iterations);
            u.Created = DateTime.Now.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            return u;
        }

        public static void SetPassword(AppUser u, string password)
        {
            u.Iterations = Crypto.Iterations;
            u.Salt = Crypto.Random(16);
            u.Hash = Crypto.Pbkdf2(password, u.Salt, u.Iterations);
        }

        public static AppUser Verify(string name, string password)
        {
            string n = (name ?? "").Trim().ToLowerInvariant();
            AppUser found = null;
            foreach (AppUser u in Load()) if (u.Name == n) found = u;
            if (found == null)
            {
                // stesso tempo di calcolo anche per utenti inesistenti
                Crypto.Pbkdf2(password ?? "", new byte[16], Crypto.Iterations);
                return null;
            }
            byte[] h = Crypto.Pbkdf2(password ?? "", found.Salt, found.Iterations);
            return Crypto.SlowEquals(h, found.Hash) ? found : null;
        }

        public static string ValidateName(string name)
        {
            string n = (name ?? "").Trim();
            if (n.Length < 3 || n.Length > 32) return "Il nome utente deve avere da 3 a 32 caratteri.";
            foreach (char c in n.ToLowerInvariant())
                if (!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '.' || c == '_' || c == '-'))
                    return "Il nome utente può contenere solo lettere, numeri, punto, trattino e underscore.";
            return null;
        }

        public static string ValidatePassword(string pw, string confirm, string name)
        {
            if (pw == null || pw.Length < Config.MinPasswordLength)
                return "La password deve avere almeno " + Config.MinPasswordLength + " caratteri.";
            bool letter = false, digit = false;
            foreach (char c in pw) { if (char.IsLetter(c)) letter = true; if (char.IsDigit(c)) digit = true; }
            if (!letter || !digit) return "La password deve contenere lettere e numeri.";
            if (name != null && pw.ToLowerInvariant().Contains(name.Trim().ToLowerInvariant()))
                return "La password non può contenere il nome utente.";
            if (pw != confirm) return "Le due password non coincidono.";
            return null;
        }
    }

    // ---------------------------------------------------------------- registro a catena

    class AuditCheck
    {
        public bool Ok;
        public int Count;
        public int BadLine;
        public string Error;
    }

    static class Audit
    {
        static readonly object gate = new object();
        static readonly UTF8Encoding Utf8 = new UTF8Encoding(false);
        const string Genesis = "PASSWORD-OPERATORI-GENESIS";

        static string Clean(string s)
        {
            if (string.IsNullOrEmpty(s)) return "-";
            StringBuilder sb = new StringBuilder(s.Length);
            foreach (char c in s) sb.Append(c == '|' || char.IsControl(c) ? ' ' : c);
            string r = sb.ToString().Trim();
            return r.Length > 200 ? r.Substring(0, 200) : r;
        }

        // Restituisce false se il registro non e' scrivibile: le azioni sensibili vanno negate.
        public static bool Write(string evt, string details)
        {
            try
            {
                lock (gate)
                {
                    string who = Session.User != null ? Session.User.Name : "-";
                    string body = string.Join(" | ", new string[] {
                        DateTime.Now.ToString("yyyy-MM-ddTHH:mm:sszzz", CultureInfo.InvariantCulture),
                        Clean(Environment.MachineName),
                        Clean(Environment.UserDomainName + "\\" + Environment.UserName),
                        Clean(who), evt, Clean(details) });
                    using (FileStream fs = OpenAppend())
                    {
                        string hash = Crypto.Sha256Hex(LastHash() + "\n" + body).Substring(0, 32);
                        byte[] bytes = Utf8.GetBytes(body + " | " + hash + "\r\n");
                        fs.Write(bytes, 0, bytes.Length);
                        fs.Flush(true);
                    }
                }
                return true;
            }
            catch { return false; }
        }

        // Solo diritto di accodare: funziona anche con i permessi "append-only" impostati in installazione.
        static FileStream OpenAppend()
        {
            if (!File.Exists(Paths.Audit)) throw new FileNotFoundException("Registro mancante", Paths.Audit);
            try
            {
                return new FileStream(Paths.Audit, FileMode.Append, FileSystemRights.AppendData | FileSystemRights.Synchronize,
                    FileShare.Read, 4096, FileOptions.WriteThrough);
            }
            catch (UnauthorizedAccessException) { throw; }
            catch (Exception)
            {
                return new FileStream(Paths.Audit, FileMode.Append, FileAccess.Write, FileShare.Read);
            }
        }

        static string LastHash()
        {
            List<string> lines = LastLines(1);
            if (lines.Count == 0) return Genesis;
            string last = lines[0];
            int i = last.LastIndexOf(" | ", StringComparison.Ordinal);
            return i < 0 ? Genesis : last.Substring(i + 3).Trim();
        }

        // Ultime righe del registro (legge al massimo gli ultimi 256 KB).
        public static List<string> LastLines(int max)
        {
            List<string> res = new List<string>();
            if (!File.Exists(Paths.Audit)) return res;
            using (FileStream fs = new FileStream(Paths.Audit, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
            {
                long start = Math.Max(0, fs.Length - 256 * 1024);
                fs.Seek(start, SeekOrigin.Begin);
                string text;
                using (StreamReader sr = new StreamReader(fs, Utf8)) text = sr.ReadToEnd();
                string[] lines = text.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
                int from = start > 0 ? 1 : 0;   // la prima riga puo' essere tagliata
                for (int i = lines.Length - 1; i >= from && res.Count < max; i--) res.Add(lines[i]);
            }
            res.Reverse();
            return res;
        }

        public static AuditCheck Verify()
        {
            AuditCheck c = new AuditCheck();
            try
            {
                string prev = Genesis;
                int n = 0;
                using (FileStream fs = new FileStream(Paths.Audit, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
                using (StreamReader sr = new StreamReader(fs, Utf8))
                {
                    string line;
                    while ((line = sr.ReadLine()) != null)
                    {
                        if (line.Length == 0) continue;
                        n++;
                        int i = line.LastIndexOf(" | ", StringComparison.Ordinal);
                        string body = i < 0 ? line : line.Substring(0, i);
                        string hash = i < 0 ? "" : line.Substring(i + 3).Trim();
                        if (Crypto.Sha256Hex(prev + "\n" + body).Substring(0, 32) != hash)
                        {
                            c.BadLine = n;
                            c.Count = n;
                            return c;
                        }
                        prev = hash;
                    }
                }
                c.Ok = true;
                c.Count = n;
            }
            catch (Exception ex) { c.Error = ex.Message; }
            return c;
        }

        // Blocco dopo troppi tentativi: calcolato dal registro stesso, che non si puo' cancellare.
        public static DateTime LockedUntil()
        {
            List<DateTime> fails = new List<DateTime>();
            try
            {
                foreach (string line in LastLines(400))
                {
                    string[] p = line.Split(new string[] { " | " }, StringSplitOptions.None);
                    if (p.Length < 7) continue;
                    if (p[4] == "LOGIN_OK") fails.Clear();
                    else if (p[4] == "LOGIN_FAIL")
                    {
                        DateTimeOffset t;
                        if (DateTimeOffset.TryParse(p[0], CultureInfo.InvariantCulture, DateTimeStyles.None, out t)) fails.Add(t.LocalDateTime);
                    }
                }
            }
            catch { }
            DateTime window = DateTime.Now.AddMinutes(-Config.LockoutWindowMinutes);
            fails.RemoveAll(delegate(DateTime t) { return t < window; });
            if (fails.Count < Config.MaxFailures) return DateTime.MinValue;
            int rounds = fails.Count / Config.MaxFailures;
            return fails[fails.Count - 1].AddMinutes(Config.LockoutMinutes * rounds);
        }
    }

    // ---------------------------------------------------------------- Windows

    static class Win
    {
        public static bool IsWindows { get { return Environment.OSVersion.Platform == PlatformID.Win32NT; } }

        public static bool IsElevated()
        {
            try { return new WindowsPrincipal(WindowsIdentity.GetCurrent()).IsInRole(WindowsBuiltInRole.Administrator); }
            catch { return false; }
        }

        public static bool RelaunchElevated(string args)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo(Application.ExecutablePath, args);
                psi.Verb = "runas";
                psi.UseShellExecute = true;
                Process.Start(psi);
                return true;
            }
            catch { return false; }
        }

        // Crea la cartella dati con permessi stretti (richiede amministratore):
        // - Amministratori e SYSTEM: controllo completo.
        // - Utenti: lettura della cartella; sul registro solo lettura + accodamento (append-only).
        public static void SecureDataFolder()
        {
            Directory.CreateDirectory(Paths.Dir);
            if (!File.Exists(Paths.Audit)) File.WriteAllBytes(Paths.Audit, new byte[0]);
            if (!IsWindows) return;

            SecurityIdentifier admins = new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null);
            SecurityIdentifier system = new SecurityIdentifier(WellKnownSidType.LocalSystemSid, null);
            SecurityIdentifier users = new SecurityIdentifier(WellKnownSidType.BuiltinUsersSid, null);
            InheritanceFlags inh = InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit;

            DirectorySecurity ds = new DirectorySecurity();
            ds.SetAccessRuleProtection(true, false);
            ds.AddAccessRule(new FileSystemAccessRule(admins, FileSystemRights.FullControl, inh, PropagationFlags.None, AccessControlType.Allow));
            ds.AddAccessRule(new FileSystemAccessRule(system, FileSystemRights.FullControl, inh, PropagationFlags.None, AccessControlType.Allow));
            ds.AddAccessRule(new FileSystemAccessRule(users, FileSystemRights.ReadAndExecute, inh, PropagationFlags.None, AccessControlType.Allow));
            Directory.SetAccessControl(Paths.Dir, ds);

            FileSecurity fsec = new FileSecurity();
            fsec.SetAccessRuleProtection(true, false);
            fsec.AddAccessRule(new FileSystemAccessRule(admins, FileSystemRights.FullControl, AccessControlType.Allow));
            fsec.AddAccessRule(new FileSystemAccessRule(system, FileSystemRights.FullControl, AccessControlType.Allow));
            fsec.AddAccessRule(new FileSystemAccessRule(users,
                FileSystemRights.Read | FileSystemRights.AppendData | FileSystemRights.Synchronize, AccessControlType.Allow));
            File.SetAccessControl(Paths.Audit, fsec);
        }
    }
}
