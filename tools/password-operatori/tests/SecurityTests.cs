// Test di sicurezza (PBKDF2, utenti, registro a catena, blocco tentativi).
// ATTENZIONE: cancella e ricrea la cartella dati del programma. Non eseguire su un server in produzione.
// Compilazione: csc /main:PasswordOperatori.Tests /r:System.Windows.Forms.dll /r:System.Drawing.dll ..\PasswordOperatori.cs ..\Security.cs ..\AdminForms.cs SecurityTests.cs
using System; using System.IO; using System.Collections.Generic;
namespace PasswordOperatori {
static class Tests {
  static int fails;
  static void Check(bool ok, string what) { Console.WriteLine((ok ? "PASS " : "FAIL ") + what); if (!ok) fails++; }
  static string Hex(byte[] b) { var s = ""; foreach (var x in b) s += x.ToString("x2"); return s; }
  static int Main() {
    Check(Hex(Crypto.Pbkdf2("password", System.Text.Encoding.ASCII.GetBytes("salt"), 1)) == "120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b", "PBKDF2 RFC vector c=1");
    Check(Hex(Crypto.Pbkdf2("password", System.Text.Encoding.ASCII.GetBytes("salt"), 4096)) == "c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a", "PBKDF2 RFC vector c=4096");
    var sw = System.Diagnostics.Stopwatch.StartNew(); Crypto.Pbkdf2("x", new byte[16], Crypto.Iterations); Console.WriteLine("pbkdf2 " + Crypto.Iterations + " it: " + sw.ElapsedMilliseconds + " ms");
    if (Directory.Exists(Paths.Dir)) Directory.Delete(Paths.Dir, true);
    Win.SecureDataFolder();
    var a = UserStore.Create("Anna", "segreto12345", true); var r = UserStore.Create("luca", "altro987654", false);
    UserStore.Save(new List<AppUser>{a, r});
    Check(UserStore.Verify("anna", "segreto12345") != null, "login corretto (nome case-insensitive)");
    Check(UserStore.Verify("anna", "sbagliata1") == null, "password sbagliata rifiutata");
    Check(UserStore.Verify("nessuno", "segreto12345") == null, "utente inesistente rifiutato");
    Check(!File.ReadAllText(Paths.Users).Contains("segreto"), "password non in chiaro nel file");
    Check(UserStore.ValidatePassword("corta1", "corta1", "x") != null, "policy: troppo corta");
    Check(UserStore.ValidatePassword("solamentelettere", "solamentelettere", "x") != null, "policy: servono numeri");
    Check(UserStore.ValidatePassword("anna12345678", "anna12345678", "anna") != null, "policy: niente nome utente");
    Check(UserStore.ValidatePassword("buona123456", "buona123456", "anna") == null, "policy: password valida");
    Session.User = a;
    for (int i = 0; i < 3; i++) Check(Audit.Write("PASSWORD_VIEW", "operatore 0609 | test\r\nriga"), "scrittura registro " + i);
    var c = Audit.Verify(); Check(c.Ok && c.Count == 3, "catena integra (" + c.Count + ")");
    Check(Audit.LockedUntil() == DateTime.MinValue, "nessun blocco senza errori");
    for (int i = 0; i < 5; i++) Audit.Write("LOGIN_FAIL", "x");
    Check(Audit.LockedUntil() > DateTime.Now, "blocco dopo 5 errori");
    Audit.Write("LOGIN_OK", "ok"); Check(Audit.LockedUntil() == DateTime.MinValue, "login riuscito azzera il conteggio");
    var lines = new List<string>(File.ReadAllLines(Paths.Audit));
    lines[1] = lines[1].Replace("0609", "0610"); File.WriteAllLines(Paths.Audit, lines.ToArray());
    c = Audit.Verify(); Check(!c.Ok && c.BadLine == 2, "modifica rilevata alla riga " + c.BadLine);
    lines.RemoveAt(1); File.WriteAllLines(Paths.Audit, lines.ToArray());
    c = Audit.Verify(); Check(!c.Ok && c.BadLine == 2, "cancellazione rilevata alla riga " + c.BadLine);
    Check(!MctlParser.IsAllowedName("/etc/passwd") && MctlParser.IsAllowedName(@"C:\Server\Data\m_ctl999.dat"), "solo file M_CTL*.DAT");
    File.Delete(Paths.Audit);
    Check(!Audit.Write("PASSWORD_VIEW", "x"), "registro mancante -> scrittura negata");
    Directory.Delete(Paths.Dir, true);
    Console.WriteLine(fails == 0 ? "TUTTI OK" : fails + " FALLITI");
    return fails;
  }
}}
