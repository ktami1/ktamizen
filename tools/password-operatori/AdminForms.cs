// Finestre di amministrazione: prima configurazione, gestione utenti, registro accessi, informazioni.

using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace PasswordOperatori
{
    // Registra l'ultima attivita' di tastiera o mouse, per il blocco automatico.
    class ActivityFilter : IMessageFilter
    {
        public DateTime Last = DateTime.Now;

        public bool PreFilterMessage(ref Message m)
        {
            int msg = m.Msg;
            if (msg == 0x100 || msg == 0x104 || (msg >= 0x200 && msg <= 0x20E)) Last = DateTime.Now;
            return false;
        }
    }

    static class Dialogs
    {
        public static void CloseOnEscape(Form f)
        {
            f.KeyPreview = true;
            f.KeyDown += delegate(object s, KeyEventArgs e) { if (e.KeyCode == Keys.Escape) f.Close(); };
        }
    }

    // ---------------------------------------------------------------- prima configurazione

    class SetupForm : SplitForm
    {
        readonly InputBox user, pass, confirm;
        readonly bool recovery;

        // recovery = true: nuova password per un amministratore (password dimenticata), gli altri utenti restano.
        public SetupForm(bool recovery)
            : base(recovery ? "Recupero amministratore" : "Configurazione iniziale",
                   recovery ? "Recupero dell'accesso amministratore. Possibile solo con i privilegi di amministratore di Windows."
                            : "Prima configurazione su questo server. Crea l'account amministratore.", 640)
        {
            this.recovery = recovery;
            if (recovery)
                AddTitle("Recupero accesso", "Scrivi il nome dell'amministratore e scegli una nuova password. Gli altri utenti restano invariati.");
            else
                AddTitle("Configurazione iniziale", "L'amministratore gestisce le responsabili e consulta il registro accessi.");
            user = AddInput("Nome utente amministratore", false, 186);
            pass = AddInput("Password", true, 280);
            confirm = AddInput("Conferma password", true, 374);
            AddLabel("Almeno " + Config.MinPasswordLength + " caratteri, con lettere e numeri.", Theme.F(9f), Theme.Gray, 456, 22);
            PlaceError(482);
            AddButton(recovery ? "Salva nuova password" : "Crea account", 530, delegate { Create(); });
            OnEnter(user, delegate { pass.Box.Focus(); });
            OnEnter(pass, delegate { confirm.Box.Focus(); });
            OnEnter(confirm, Create);
            Shown += delegate { user.Box.Focus(); };
        }

        void Create()
        {
            string err = UserStore.ValidateName(user.Box.Text) ?? UserStore.ValidatePassword(pass.Box.Text, confirm.Box.Text, user.Box.Text);
            if (err != null) { Error.Text = err; return; }
            try
            {
                Cursor = Cursors.WaitCursor;
                Win.SecureDataFolder();
                AppUser admin;
                if (recovery)
                {
                    List<AppUser> users = UserStore.Load();
                    string name = user.Box.Text.Trim().ToLowerInvariant();
                    admin = users.Find(delegate(AppUser u) { return u.Name == name; });
                    bool existed = admin != null;
                    if (admin == null) { admin = UserStore.Create(name, pass.Box.Text, true); users.Add(admin); }
                    else { UserStore.SetPassword(admin, pass.Box.Text); admin.Admin = true; }
                    UserStore.Save(users);
                    Session.User = admin;
                    Audit.Write("ADMIN_RESET", (existed ? "nuova password per l'amministratore " : "creato l'amministratore ") + admin.Name +
                        " da utente Windows " + Environment.UserName);
                }
                else
                {
                    admin = UserStore.Create(user.Box.Text, pass.Box.Text, true);
                    UserStore.Save(new List<AppUser> { admin });
                    Session.User = admin;
                    Audit.Write("SETUP", "creato l'amministratore " + admin.Name);
                }
                Session.User = null;
                DialogResult = DialogResult.OK;
            }
            catch (Exception ex)
            {
                Error.Text = "Configurazione non riuscita: " + ex.Message;
            }
            finally
            {
                Cursor = Cursors.Default;
                pass.Box.Clear();
                confirm.Box.Clear();
            }
        }
    }

    // ---------------------------------------------------------------- nuovo utente / nuova password

    class UserDialog : SplitForm
    {
        readonly InputBox name, pass, confirm;
        readonly CheckBox admin = new CheckBox();
        readonly AppUser existing;
        public AppUser Result;

        public UserDialog(AppUser existing)
            : base(existing == null ? "Nuovo utente" : "Nuova password",
                   existing == null ? "Ogni responsabile ha il proprio utente: nel registro si vede chi ha consultato cosa." : "La nuova password sostituisce subito quella precedente.",
                   existing == null ? 680 : 560)
        {
            this.existing = existing;
            int y;
            if (existing == null)
            {
                AddTitle("Nuovo utente", "Crea un accesso personale per una responsabile.");
                name = AddInput("Nome utente", false, 186);
                y = 280;
            }
            else
            {
                AddTitle("Nuova password", "Utente: " + existing.Name + " (" + existing.Role + ")");
                y = 186;
            }
            pass = AddInput("Password", true, y);
            confirm = AddInput("Conferma password", true, y + 94);
            y += 188;
            if (existing == null)
            {
                admin.Text = "Amministratore (gestisce utenti e registro)";
                admin.Font = Theme.F(10f);
                admin.ForeColor = Theme.Ink;
                admin.BackColor = Theme.Bg;
                admin.Bounds = new Rectangle(X + Theme.S(4), Theme.S(y), Wd, Theme.S(28));
                Controls.Add(admin);
                y += 36;
            }
            AddLabel("Almeno " + Config.MinPasswordLength + " caratteri, con lettere e numeri.", Theme.F(9f), Theme.Gray, y, 22);
            PlaceError(y + 26);
            AddButton(existing == null ? "Crea utente" : "Salva password", y + 74, delegate { Save(); });
            if (name != null) OnEnter(name, delegate { pass.Box.Focus(); });
            OnEnter(pass, delegate { confirm.Box.Focus(); });
            OnEnter(confirm, Save);
            Shown += delegate { if (name != null) name.Box.Focus(); else pass.Box.Focus(); };
        }

        void Save()
        {
            string n = existing != null ? existing.Name : name.Box.Text;
            string err = (existing == null ? UserStore.ValidateName(n) : null) ?? UserStore.ValidatePassword(pass.Box.Text, confirm.Box.Text, n);
            if (err != null) { Error.Text = err; return; }
            Cursor = Cursors.WaitCursor;
            try
            {
                if (existing == null) Result = UserStore.Create(n, pass.Box.Text, admin.Checked);
                else { UserStore.SetPassword(existing, pass.Box.Text); Result = existing; }
            }
            finally
            {
                Cursor = Cursors.Default;
                pass.Box.Clear();
                confirm.Box.Clear();
            }
            DialogResult = DialogResult.OK;
        }
    }

    // ---------------------------------------------------------------- gestione utenti

    class UsersForm : Form
    {
        readonly ListBox list = new ListBox();
        readonly Label info = new Label();
        List<AppUser> users;

        public UsersForm()
        {
            AutoScaleMode = AutoScaleMode.None;
            Text = Config.AppName + " · Gestione utenti";
            Icon = Theme.AppIcon();
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterParent;
            BackColor = Theme.Bg;
            Font = Theme.F(10f);
            ClientSize = new Size(Theme.S(640), Theme.S(560));
            Dialogs.CloseOnEscape(this);

            int x = Theme.S(36), w = ClientSize.Width - Theme.S(72);
            Label title = new Label();
            title.Text = "Gestione utenti";
            title.Font = Theme.F(22f, W.Bold);
            title.ForeColor = Theme.Ink;
            title.Bounds = new Rectangle(x, Theme.S(26), w, Theme.S(44));
            Controls.Add(title);

            info.Font = Theme.F(10f);
            info.ForeColor = Theme.Gray;
            info.Bounds = new Rectangle(x, Theme.S(72), w, Theme.S(24));
            info.UseMnemonic = false;
            Controls.Add(info);

            list.Font = Theme.F(11f);
            list.BorderStyle = BorderStyle.None;
            list.IntegralHeight = false;
            list.DrawMode = DrawMode.OwnerDrawFixed;
            list.ItemHeight = Theme.S(48);
            list.DrawItem += DrawUser;
            list.Bounds = new Rectangle(x, Theme.S(112), w, Theme.S(330));
            Controls.Add(list);

            int bw = (w - Theme.S(24)) / 3;
            AddButton("Aggiungi", PillStyle.Primary, new Rectangle(x, Theme.S(466), bw, Theme.S(48)), delegate { Add(); });
            AddButton("Nuova password", PillStyle.Outline, new Rectangle(x + bw + Theme.S(12), Theme.S(466), bw, Theme.S(48)), delegate { Reset(); });
            AddButton("Elimina", PillStyle.Outline, new Rectangle(x + 2 * (bw + Theme.S(12)), Theme.S(466), bw, Theme.S(48)), delegate { Remove(); });

            LoadUsers();
        }

        void AddButton(string text, PillStyle style, Rectangle r, EventHandler click)
        {
            PillButton b = new PillButton(text, style);
            b.BackColor = Theme.Bg;
            b.Bounds = r;
            b.Click += click;
            Controls.Add(b);
        }

        void DrawUser(object sender, DrawItemEventArgs e)
        {
            if (e.Index < 0) return;
            AppUser u = (AppUser)list.Items[e.Index];
            Graphics g = e.Graphics;
            Rectangle r = e.Bounds;
            bool sel = (e.State & DrawItemState.Selected) != 0;
            using (SolidBrush b = new SolidBrush(sel ? Theme.Muted : Theme.Surface)) g.FillRectangle(b, r);
            if (sel) using (SolidBrush b = new SolidBrush(Theme.Accent)) g.FillRectangle(b, r.X, r.Y + Theme.S(12), Theme.S(4), r.Height - Theme.S(24));
            Theme.Text(g, u.Name, Theme.F(11f, W.Bold), new Rectangle(r.X + Theme.S(22), r.Y, r.Width / 2, r.Height), Theme.Ink, 0);
            Theme.Text(g, u.Role + "  ·  dal " + u.Created, Theme.F(9.5f), new Rectangle(r.X + r.Width / 2, r.Y, r.Width / 2 - Theme.S(20), r.Height),
                u.Admin ? Theme.Accent : Theme.Gray, TextFormatFlags.Right);
            using (Pen p = new Pen(Theme.Divider)) g.DrawLine(p, r.X, r.Bottom - 1, r.Right, r.Bottom - 1);
        }

        void LoadUsers()
        {
            users = UserStore.Load();
            list.Items.Clear();
            foreach (AppUser u in users) list.Items.Add(u);
            info.Text = users.Count + (users.Count == 1 ? " utente" : " utenti") + " · le password sono salvate solo come hash PBKDF2";
        }

        AppUser Selected()
        {
            AppUser u = list.SelectedItem as AppUser;
            if (u == null) MessageBox.Show(this, "Seleziona prima un utente.", Text, MessageBoxButtons.OK, MessageBoxIcon.Information);
            return u;
        }

        void Persist(string evt, string details)
        {
            try
            {
                UserStore.Save(users);
                Audit.Write(evt, details);
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, "Salvataggio non riuscito: " + ex.Message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            LoadUsers();
        }

        void Add()
        {
            using (UserDialog d = new UserDialog(null))
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                foreach (AppUser u in users)
                    if (u.Name == d.Result.Name)
                    {
                        MessageBox.Show(this, "Esiste già un utente “" + u.Name + "”.", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                users.Add(d.Result);
                Persist("USER_ADD", d.Result.Name + " (" + d.Result.Role + ")");
            }
        }

        void Reset()
        {
            AppUser u = Selected();
            if (u == null) return;
            using (UserDialog d = new UserDialog(u))
            {
                if (d.ShowDialog(this) != DialogResult.OK) return;
                Persist("USER_PASSWORD", "nuova password per " + u.Name);
            }
        }

        void Remove()
        {
            AppUser u = Selected();
            if (u == null) return;
            if (Session.User != null && u.Name == Session.User.Name)
            {
                MessageBox.Show(this, "Non puoi eliminare l'utente con cui hai effettuato l'accesso.", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            int admins = 0;
            foreach (AppUser x in users) if (x.Admin) admins++;
            if (u.Admin && admins <= 1)
            {
                MessageBox.Show(this, "Deve restare almeno un amministratore.", Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }
            if (MessageBox.Show(this, "Eliminare l'utente “" + u.Name + "”?", Text, MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
            users.Remove(u);
            Persist("USER_REMOVE", u.Name);
        }
    }

    // ---------------------------------------------------------------- registro accessi

    class AuditForm : Form
    {
        public AuditForm()
        {
            AutoScaleMode = AutoScaleMode.None;
            Text = Config.AppName + " · Registro accessi";
            Icon = Theme.AppIcon();
            StartPosition = FormStartPosition.CenterParent;
            BackColor = Theme.Bg;
            Font = Theme.F(10f);
            ClientSize = new Size(Theme.S(980), Theme.S(640));
            Dialogs.CloseOnEscape(this);
            MinimumSize = new Size(Theme.S(700), Theme.S(420));
            Padding = new Padding(Theme.S(28));

            AuditCheck check = Audit.Verify();
            Panel banner = new Panel();
            banner.Dock = DockStyle.Top;
            banner.Height = Theme.S(64);
            Color tone = check.Ok ? Theme.GreenText : Theme.RedText;
            string msg;
            if (check.Error != null) msg = "Registro non leggibile: " + check.Error;
            else if (check.Ok) msg = "Registro integro: " + check.Count + " eventi, nessuna modifica o cancellazione rilevata.";
            else msg = "ATTENZIONE: il registro è stato alterato alla riga " + check.BadLine + ". Le righe successive non sono affidabili.";
            banner.Paint += delegate(object s, PaintEventArgs e)
            {
                Graphics g = e.Graphics;
                g.Clear(Theme.Bg);
                g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                RectangleF r = new RectangleF(0.5f, 0.5f, banner.Width - 1.5f, banner.Height - Theme.S(14));
                Theme.FillRound(g, Color.FromArgb(28, tone), r, r.Height / 2);
                Theme.Led(g, tone, Theme.S(26), r.Height / 2, Theme.S(10), false);
                Theme.Text(g, msg, Theme.F(10f, W.Bold), new Rectangle(Theme.S(44), 0, banner.Width - Theme.S(60), (int)r.Height), tone, 0);
            };

            TextBox box = new TextBox();
            box.Multiline = true;
            box.ReadOnly = true;
            box.ScrollBars = ScrollBars.Both;
            box.WordWrap = false;
            box.BorderStyle = BorderStyle.None;
            box.BackColor = Theme.Surface;
            box.Font = new Font("Consolas", 9.5f);
            box.Dock = DockStyle.Fill;
            List<string> lines = Audit.LastLines(2000);
            lines.Reverse();
            box.Text = lines.Count == 0 ? "(nessun evento)" : string.Join("\r\n", lines.ToArray());

            Label foot = new Label();
            foot.Dock = DockStyle.Bottom;
            foot.Height = Theme.S(36);
            foot.TextAlign = ContentAlignment.BottomLeft;
            foot.ForeColor = Theme.Gray;
            foot.Font = Theme.F(9f);
            foot.UseMnemonic = false;
            foot.Text = "Più recenti in alto · data | computer | utente Windows | utente | evento | dettagli | hash · " + Paths.Audit;

            Controls.Add(box);
            Controls.Add(foot);
            Controls.Add(banner);
            Shown += delegate { box.SelectionStart = 0; box.SelectionLength = 0; };
        }
    }

    // ---------------------------------------------------------------- informazioni e sicurezza

    class InfoForm : Form
    {
        public InfoForm(string dataFile)
        {
            AutoScaleMode = AutoScaleMode.None;
            Text = Config.AppName + " · Informazioni e sicurezza";
            Icon = Theme.AppIcon();
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            MinimizeBox = false;
            StartPosition = FormStartPosition.CenterParent;
            BackColor = Theme.Bg;
            Font = Theme.F(10f);
            ClientSize = new Size(Theme.S(760), Theme.S(600));
            Dialogs.CloseOnEscape(this);

            string exeHash;
            try { exeHash = Crypto.FileSha256(Application.ExecutablePath); }
            catch { exeHash = "non disponibile"; }
            AuditCheck check = Audit.Verify();

            string[,] rows = {
                { "Versione", Config.AppName + " " + Config.Version },
                { "SHA-256 eseguibile", exeHash },
                { "File letto", dataFile + "  (solo lettura)" },
                { "Dati del programma", Paths.Dir },
                { "Rete", "Nessuna connessione: il programma non contiene codice di rete" },
                { "Password utenti", "PBKDF2-HMAC-SHA256, " + Crypto.Iterations.ToString("N0") + " iterazioni, sale casuale" },
                { "Blocco tentativi", Config.MaxFailures + " errori in " + Config.LockoutWindowMinutes + " min → blocco di " + Config.LockoutMinutes + " min" },
                { "Blocco automatico", "Dopo " + (Config.IdleLockSeconds / 60) + " minuti di inattività" },
                { "Password operatore", "Nascosta finché non richiesta, visibile " + Config.RevealSeconds + " s, ogni visualizzazione registrata" },
                { "Registro", check.Ok ? "Integro (" + check.Count + " eventi)" : (check.Error ?? "Alterato alla riga " + check.BadLine) },
            };

            Panel body = new Panel();
            body.Dock = DockStyle.Fill;
            body.Paint += delegate(object s, PaintEventArgs e)
            {
                Graphics g = e.Graphics;
                g.Clear(Theme.Bg);
                int x = Theme.S(36), y = Theme.S(28), w = body.Width - Theme.S(72);
                Theme.Text(g, "Informazioni e sicurezza", Theme.F(22f, W.Bold), new Rectangle(x, y, w, Theme.S(44)), Theme.Ink, 0);
                y += Theme.S(64);
                for (int i = 0; i < rows.GetLength(0); i++)
                {
                    Theme.Text(g, rows[i, 0].ToUpperInvariant(), Theme.F(8f, W.Bold), new Rectangle(x, y, w, Theme.S(18)), Theme.Gray, 0);
                    TextRenderer.DrawText(g, rows[i, 1], Theme.F(10f), new Rectangle(x, y + Theme.S(18), w, Theme.S(24)),
                        rows[i, 0] == "Registro" && !check.Ok ? Theme.RedText : Theme.Ink,
                        TextFormatFlags.NoPrefix | TextFormatFlags.SingleLine | TextFormatFlags.PathEllipsis | TextFormatFlags.NoPadding);
                    y += Theme.S(48);
                }
            };
            Controls.Add(body);
        }
    }
}
