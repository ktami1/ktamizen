// MCTL Viewer - legge M_CTL999.DAT e mostra password, cassa e stato degli operatori.
// Singolo file, compatibile con il compilatore C# 5 incluso in .NET Framework 4.x
// (C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe): vedi build.bat.

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

[assembly: System.Reflection.AssemblyTitle("MCTL Viewer")]
[assembly: System.Reflection.AssemblyProduct("MCTL Viewer")]
[assembly: System.Reflection.AssemblyVersion("1.0.0.0")]

namespace MctlViewer
{
    static class Config
    {
        // Credenziali della responsabile (provvisorie).
        public const string AdminUser = "admin";
        public const string AdminPassword = "admin";

        public const string FileName = "M_CTL999.DAT";
        public const string DefaultDir = @"C:\Server\Data";
        public const int RefreshMs = 3000;
    }

    // ---------------------------------------------------------------- dati

    enum OpState { NeverOpened, Open, Closed, Paused, Unknown }

    class Operatore
    {
        public string Codice;       // 0609
        public string Nome;         // CASSIERE 609
        public string Chiave;       // 06090609
        public string Cassa;        // 0024
        public string Password;     // 09
        public string StatoRaw;     // 01 aperto, 02 chiuso, 08 pausa
        public string Data;         // 170303 (AAMMGG)
        public string OraApertura;  // 1011
        public string OraChiusura;  // 0000

        public string CodiceBreve { get { return TrimZeros(Codice); } }
        public string CassaBreve { get { return TrimZeros(Cassa); } }

        public OpState Stato
        {
            get
            {
                switch (StatoRaw)
                {
                    case "01": return OpState.Open;
                    case "02": return OpState.Closed;
                    case "08": return OpState.Paused;
                    case "":
                    case "00": return OpState.NeverOpened;
                    default: return OpState.Unknown;
                }
            }
        }

        public string Messaggio
        {
            get
            {
                switch (Stato)
                {
                    case OpState.Open: return "Risulta aperto in cassa " + CassaBreve;
                    case OpState.Paused: return "Risulta in pausa in cassa " + CassaBreve;
                    case OpState.Closed: return "Risulta chiuso";
                    case OpState.NeverOpened: return "Non risulta ancora aperto";
                    default: return "Stato sconosciuto (" + StatoRaw + ")";
                }
            }
        }

        public string StatoBreve
        {
            get
            {
                switch (Stato)
                {
                    case OpState.Open: return "Aperto · cassa " + CassaBreve;
                    case OpState.Paused: return "In pausa · cassa " + CassaBreve;
                    case OpState.Closed: return "Chiuso";
                    case OpState.NeverOpened: return "Non aperto";
                    default: return "Stato " + StatoRaw;
                }
            }
        }

        public Color Led
        {
            get
            {
                switch (Stato)
                {
                    case OpState.Open: return Theme.Green;
                    case OpState.Paused: return Theme.Orange;
                    case OpState.Closed: return Theme.Red;
                    default: return Theme.Grey;
                }
            }
        }

        public Color TextColor
        {
            get
            {
                switch (Stato)
                {
                    case OpState.Open: return Theme.GreenText;
                    case OpState.Paused: return Theme.OrangeText;
                    case OpState.Closed: return Theme.RedText;
                    default: return Theme.TextSecondary;
                }
            }
        }

        public string CassaFmt { get { return IsZero(Cassa) ? "—" : CassaBreve; } }

        public string DataFmt
        {
            get
            {
                DateTime d;
                if (!IsZero(Data) && DateTime.TryParseExact(Data, "yyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
                    return d.ToString("dd/MM/yyyy");
                return IsZero(Data) ? "—" : Data;
            }
        }

        public string AperturaFmt { get { return FormatOra(OraApertura); } }
        public string ChiusuraFmt { get { return FormatOra(OraChiusura); } }

        static string FormatOra(string hhmm)
        {
            if (IsZero(hhmm)) return "—";
            if (hhmm.Length == 4) return hhmm.Substring(0, 2) + ":" + hhmm.Substring(2, 2);
            return hhmm;
        }

        static bool IsZero(string s)
        {
            return string.IsNullOrEmpty(s) || s.Trim('0').Length == 0;
        }

        public static string TrimZeros(string s)
        {
            string t = (s ?? "").TrimStart('0');
            return t.Length == 0 ? "0" : t;
        }
    }

    static class MctlParser
    {
        public static List<Operatore> Load(string path)
        {
            List<Operatore> list = new List<Operatore>();
            // FileShare.ReadWrite: il file puo' essere aperto in scrittura dal gestionale.
            using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
            using (StreamReader sr = new StreamReader(fs, Encoding.Default))
            {
                string line;
                while ((line = sr.ReadLine()) != null)
                {
                    Operatore op = ParseLine(line);
                    if (op != null) list.Add(op);
                }
            }
            return list;
        }

        // Riga: 0609:CASSIERE 609      :06090609:0024:09:01:170303:1011:0000
        // I campi vengono letti da destra, cosi' un eventuale ':' nel nome non sposta le colonne.
        public static Operatore ParseLine(string line)
        {
            if (string.IsNullOrEmpty(line) || line.Trim().Length == 0) return null;
            string[] p = line.Split(':');
            int n = p.Length;
            if (n < 9) return null;

            Operatore op = new Operatore();
            op.Codice = p[0].Trim();
            op.Nome = string.Join(":", p, 1, n - 8).Trim();
            op.Chiave = p[n - 7].Trim();
            op.Cassa = p[n - 6].Trim();
            op.Password = p[n - 5].Trim();
            op.StatoRaw = p[n - 4].Trim();
            op.Data = p[n - 3].Trim();
            op.OraApertura = p[n - 2].Trim();
            op.OraChiusura = p[n - 1].Trim();

            if (op.Codice.Length == 0 || !IsDigits(op.Codice)) return null;
            return op;
        }

        public static bool IsDigits(string s)
        {
            if (s.Length == 0) return false;
            foreach (char c in s) if (c < '0' || c > '9') return false;
            return true;
        }
    }

    // ---------------------------------------------------------------- stile

    static class Theme
    {
        public static float Scale = 1f;
        public static int S(float v) { return (int)Math.Round(v * Scale); }

        public static readonly Color Bg = Color.FromArgb(248, 249, 250);
        public static readonly Color Surface = Color.White;
        public static readonly Color Border = Color.FromArgb(218, 220, 224);
        public static readonly Color Text = Color.FromArgb(32, 33, 36);
        public static readonly Color TextSecondary = Color.FromArgb(95, 99, 104);
        public static readonly Color Accent = Color.FromArgb(26, 115, 232);
        public static readonly Color AccentHover = Color.FromArgb(25, 103, 210);
        public static readonly Color AccentSoft = Color.FromArgb(232, 240, 254);
        public static readonly Color Hover = Color.FromArgb(241, 243, 244);

        public static readonly Color Green = Color.FromArgb(52, 168, 83);
        public static readonly Color Orange = Color.FromArgb(251, 140, 0);
        public static readonly Color Red = Color.FromArgb(234, 67, 53);
        public static readonly Color Grey = Color.FromArgb(189, 193, 198);
        public static readonly Color GreenText = Color.FromArgb(19, 115, 51);
        public static readonly Color OrangeText = Color.FromArgb(178, 92, 0);
        public static readonly Color RedText = Color.FromArgb(197, 34, 31);

        static readonly Dictionary<string, Font> fonts = new Dictionary<string, Font>();

        public static Font F(float size) { return F(size, false); }

        public static Font F(float size, bool semibold)
        {
            string key = size.ToString(CultureInfo.InvariantCulture) + (semibold ? "b" : "");
            Font f;
            if (!fonts.TryGetValue(key, out f))
            {
                f = semibold ? new Font("Segoe UI Semibold", size) : new Font("Segoe UI", size);
                fonts[key] = f;
            }
            return f;
        }

        public static GraphicsPath Round(RectangleF r, float radius)
        {
            float d = Math.Min(radius * 2, Math.Min(r.Width, r.Height));
            GraphicsPath path = new GraphicsPath();
            if (d <= 0) { path.AddRectangle(r); return path; }
            path.AddArc(r.X, r.Y, d, d, 180, 90);
            path.AddArc(r.Right - d, r.Y, d, d, 270, 90);
            path.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
            path.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
            path.CloseFigure();
            return path;
        }

        public static void PaintLed(Graphics g, Rectangle r, Color c, bool glow)
        {
            SmoothingMode old = g.SmoothingMode;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            if (glow)
            {
                int pad = Math.Max(2, r.Width / 3);
                Rectangle halo = Rectangle.Inflate(r, pad, pad);
                using (SolidBrush b = new SolidBrush(Color.FromArgb(50, c))) g.FillEllipse(b, halo);
            }
            using (SolidBrush b = new SolidBrush(c)) g.FillEllipse(b, r);
            if (glow)
            {
                Rectangle hl = new Rectangle(r.X + r.Width / 5, r.Y + r.Height / 6, r.Width / 3, r.Height / 4);
                using (SolidBrush b = new SolidBrush(Color.FromArgb(110, Color.White))) g.FillEllipse(b, hl);
            }
            g.SmoothingMode = old;
        }

        public static Icon AppIcon()
        {
            try
            {
                Bitmap bmp = new Bitmap(32, 32);
                using (Graphics g = Graphics.FromImage(bmp))
                {
                    g.SmoothingMode = SmoothingMode.AntiAlias;
                    using (SolidBrush b = new SolidBrush(Accent)) g.FillEllipse(b, 1, 1, 30, 30);
                    using (Pen p = new Pen(Color.White, 3f))
                    {
                        g.DrawEllipse(p, 7, 11, 9, 9);
                        g.DrawLine(p, 16, 15.5f, 25, 15.5f);
                        g.DrawLine(p, 22, 15.5f, 22, 20);
                    }
                }
                return Icon.FromHandle(bmp.GetHicon());
            }
            catch { return null; }
        }

        public const TextFormatFlags Line = TextFormatFlags.NoPrefix | TextFormatFlags.SingleLine |
            TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding;
    }

    static class Native
    {
        [DllImport("user32.dll")]
        public static extern bool SetProcessDPIAware();

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, string lParam);

        public static void SetCue(TextBox tb, string cue)
        {
            try { SendMessage(tb.Handle, 0x1501 /* EM_SETCUEBANNER */, (IntPtr)1, cue); }
            catch { }
        }
    }

    // ---------------------------------------------------------------- controlli

    class RoundCard : Panel
    {
        public RoundCard()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint |
                     ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            using (GraphicsPath path = Theme.Round(new RectangleF(0.5f, 0.5f, Width - 1.5f, Height - 1.5f), Theme.S(16)))
            using (SolidBrush b = new SolidBrush(Theme.Surface))
            using (Pen p = new Pen(Theme.Border))
            {
                g.FillPath(b, path);
                g.DrawPath(p, path);
            }
        }
    }

    class InputBox : Control
    {
        public readonly TextBox Box = new TextBox();
        bool focused;

        public InputBox(string cue, bool password)
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint |
                     ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
            Cursor = Cursors.IBeam;
            Box.BorderStyle = BorderStyle.None;
            Box.Font = Theme.F(11.5f);
            Box.BackColor = Theme.Surface;
            Box.ForeColor = Theme.Text;
            if (password) Box.UseSystemPasswordChar = true;
            Box.GotFocus += delegate { focused = true; Invalidate(); };
            Box.LostFocus += delegate { focused = false; Invalidate(); };
            Box.HandleCreated += delegate { Native.SetCue(Box, cue); };
            Controls.Add(Box);
        }

        protected override void OnClick(EventArgs e) { base.OnClick(e); Box.Focus(); }

        protected override void OnLayout(LayoutEventArgs e)
        {
            base.OnLayout(e);
            int pad = Theme.S(18);
            Box.SetBounds(pad, (Height - Box.Height) / 2, Math.Max(10, Width - 2 * pad), Box.Height);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            float w = focused ? 2f : 1f;
            RectangleF r = new RectangleF(w / 2 + 0.5f, w / 2 + 0.5f, Width - w - 1.5f, Height - w - 1.5f);
            using (GraphicsPath path = Theme.Round(r, Theme.S(12)))
            using (SolidBrush b = new SolidBrush(Theme.Surface))
            using (Pen p = new Pen(focused ? Theme.Accent : Theme.Border, w))
            {
                g.FillPath(b, path);
                g.DrawPath(p, path);
            }
        }
    }

    class PillButton : Control
    {
        public bool Primary = true;
        bool hover;

        public PillButton(string text)
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint |
                     ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw |
                     ControlStyles.SupportsTransparentBackColor, true);
            Text = text;
            Cursor = Cursors.Hand;
            Font = Theme.F(10.5f, true);
        }

        protected override void OnMouseEnter(EventArgs e) { base.OnMouseEnter(e); hover = true; Invalidate(); }
        protected override void OnMouseLeave(EventArgs e) { base.OnMouseLeave(e); hover = false; Invalidate(); }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Color fill = Primary ? (hover ? Theme.AccentHover : Theme.Accent) : (hover ? Theme.AccentSoft : Color.Empty);
            if (fill != Color.Empty)
            {
                using (GraphicsPath path = Theme.Round(new RectangleF(0, 0, Width - 1, Height - 1), Height / 2f))
                using (SolidBrush b = new SolidBrush(fill))
                    g.FillPath(b, path);
            }
            TextRenderer.DrawText(g, Text, Font, ClientRectangle, Primary ? Color.White : Theme.Accent,
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPrefix);
        }
    }

    class OperatorList : ListBox
    {
        public OperatorList()
        {
            DrawMode = DrawMode.OwnerDrawFixed;
            ItemHeight = Theme.S(46);
            BorderStyle = BorderStyle.None;
            IntegralHeight = false;
            BackColor = Theme.Surface;
            Font = Theme.F(10f);
        }

        protected override void OnDrawItem(DrawItemEventArgs e)
        {
            if (e.Index < 0 || e.Index >= Items.Count) return;
            Operatore op = (Operatore)Items[e.Index];
            Graphics g = e.Graphics;
            Rectangle r = e.Bounds;
            bool sel = (e.State & DrawItemState.Selected) != 0;

            using (SolidBrush b = new SolidBrush(BackColor)) g.FillRectangle(b, r);
            if (sel)
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                RectangleF hr = new RectangleF(r.X + Theme.S(4), r.Y + Theme.S(2), r.Width - Theme.S(8), r.Height - Theme.S(4));
                using (GraphicsPath path = Theme.Round(hr, Theme.S(10)))
                using (SolidBrush b = new SolidBrush(Theme.AccentSoft))
                    g.FillPath(b, path);
            }

            int d = Theme.S(10);
            Theme.PaintLed(g, new Rectangle(r.X + Theme.S(18), r.Y + (r.Height - d) / 2, d, d), op.Led, false);

            int x = r.X + Theme.S(42);
            int codeW = Theme.S(52);
            int statusW = Theme.S(150);
            Color main = sel ? Theme.Accent : Theme.Text;
            TextRenderer.DrawText(g, op.Codice, Theme.F(10f, true), new Rectangle(x, r.Y, codeW, r.Height), main, Theme.Line);
            TextRenderer.DrawText(g, op.Nome, Theme.F(10f), new Rectangle(x + codeW, r.Y, r.Right - x - codeW - statusW - Theme.S(16), r.Height), main, Theme.Line);
            TextRenderer.DrawText(g, op.StatoBreve, Theme.F(9.5f), new Rectangle(r.Right - statusW - Theme.S(16), r.Y, statusW, r.Height),
                op.Stato == OpState.NeverOpened ? Theme.TextSecondary : op.TextColor, Theme.Line | TextFormatFlags.Right);
        }
    }

    class CardView : Control
    {
        Operatore op;
        string message;

        public CardView()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint |
                     ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        }

        public Operatore Operatore { get { return op; } set { op = value; Invalidate(); } }
        public string Message { get { return message; } set { message = value; Invalidate(); } }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.Clear(BackColor);
            g.SmoothingMode = SmoothingMode.AntiAlias;
            using (GraphicsPath path = Theme.Round(new RectangleF(0.5f, 0.5f, Width - 1.5f, Height - 1.5f), Theme.S(16)))
            using (SolidBrush b = new SolidBrush(Theme.Surface))
            using (Pen p = new Pen(Theme.Border))
            {
                g.FillPath(b, path);
                g.DrawPath(p, path);
            }

            int pad = Theme.S(24);
            int x = pad, y = pad, w = Width - 2 * pad;

            if (op == null || message != null)
            {
                string text = message ?? "Cerca un operatore per codice o nome\nper vedere password, cassa e stato.";
                TextRenderer.DrawText(g, text, Theme.F(10.5f), new Rectangle(x, 0, w, Height), Theme.TextSecondary,
                    TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPrefix | TextFormatFlags.WordBreak);
                return;
            }

            // LED + nome
            int d = Theme.S(14);
            Theme.PaintLed(g, new Rectangle(x + Theme.S(3), y + Theme.S(4), d, d), op.Led, true);
            TextRenderer.DrawText(g, op.Nome + "   ·   cod. " + op.Codice, Theme.F(9.5f),
                new Rectangle(x + d + Theme.S(16), y, w - d - Theme.S(16), Theme.S(22)), Theme.TextSecondary, Theme.Line);
            y += Theme.S(38);

            // "La password dell'operatore 609 è 09"
            Font hf = Theme.F(16f);
            Font pf = Theme.F(16f, true);
            string pre = "La password dell'operatore " + op.CodiceBreve + " è";
            Size ps = TextRenderer.MeasureText(g, pre, hf, Size.Empty, TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix);
            Size pw = TextRenderer.MeasureText(g, op.Password, pf, Size.Empty, TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix);
            int lineH = Math.Max(ps.Height, pw.Height) + Theme.S(10);
            TextRenderer.DrawText(g, pre, hf, new Rectangle(x, y, ps.Width + 2, lineH), Theme.Text,
                TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix | TextFormatFlags.VerticalCenter | TextFormatFlags.SingleLine);
            Rectangle chip = new Rectangle(x + ps.Width + Theme.S(10), y, pw.Width + Theme.S(24), lineH);
            using (GraphicsPath path = Theme.Round(chip, Theme.S(10)))
            using (SolidBrush b = new SolidBrush(Theme.AccentSoft))
                g.FillPath(b, path);
            TextRenderer.DrawText(g, op.Password, pf, chip, Theme.Accent,
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix);
            y += lineH + Theme.S(12);

            // stato
            TextRenderer.DrawText(g, op.Messaggio, Theme.F(12.5f), new Rectangle(x, y, w, Theme.S(28)), op.TextColor, Theme.Line);
            y += Theme.S(42);

            using (Pen p = new Pen(Theme.Border)) g.DrawLine(p, x, y, x + w, y);
            y += Theme.S(16);

            // dettagli
            string[] labels = { "CASSA", "DATA", "APERTURA", "CHIUSURA" };
            string[] values = { op.CassaFmt, op.DataFmt, op.AperturaFmt, op.ChiusuraFmt };
            int cw = w / labels.Length;
            for (int i = 0; i < labels.Length; i++)
            {
                int cx = x + i * cw;
                TextRenderer.DrawText(g, labels[i], Theme.F(8f, true), new Rectangle(cx, y, cw, Theme.S(18)), Theme.TextSecondary, Theme.Line);
                TextRenderer.DrawText(g, values[i], Theme.F(13f), new Rectangle(cx, y + Theme.S(20), cw, Theme.S(30)), Theme.Text, Theme.Line);
            }
        }
    }

    // ---------------------------------------------------------------- login

    class LoginForm : Form
    {
        readonly InputBox user = new InputBox("Utente", false);
        readonly InputBox pass = new InputBox("Password", true);
        readonly Label err = new Label();

        public LoginForm()
        {
            AutoScaleMode = AutoScaleMode.None;
            Text = "MCTL Viewer - Accesso";
            Icon = Theme.AppIcon();
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Theme.Bg;
            Font = Theme.F(10f);
            ClientSize = new Size(Theme.S(420), Theme.S(420));

            RoundCard card = new RoundCard();
            card.BackColor = Theme.Bg;
            card.Bounds = new Rectangle(Theme.S(24), Theme.S(24), ClientSize.Width - Theme.S(48), ClientSize.Height - Theme.S(48));
            Controls.Add(card);

            int x = Theme.S(32), w = card.Width - Theme.S(64);

            Label title = new Label();
            title.Text = "Password Operatori";
            title.Font = Theme.F(18f);
            title.ForeColor = Theme.Text;
            title.BackColor = Theme.Surface;
            title.TextAlign = ContentAlignment.MiddleCenter;
            title.Bounds = new Rectangle(x, Theme.S(36), w, Theme.S(40));
            card.Controls.Add(title);

            Label sub = new Label();
            sub.Text = "Accesso riservato alla responsabile";
            sub.Font = Theme.F(10f);
            sub.ForeColor = Theme.TextSecondary;
            sub.BackColor = Theme.Surface;
            sub.TextAlign = ContentAlignment.MiddleCenter;
            sub.Bounds = new Rectangle(x, Theme.S(78), w, Theme.S(24));
            card.Controls.Add(sub);

            user.BackColor = Theme.Surface;
            user.Bounds = new Rectangle(x, Theme.S(128), w, Theme.S(50));
            card.Controls.Add(user);

            pass.BackColor = Theme.Surface;
            pass.Bounds = new Rectangle(x, Theme.S(190), w, Theme.S(50));
            card.Controls.Add(pass);

            err.ForeColor = Theme.RedText;
            err.BackColor = Theme.Surface;
            err.Font = Theme.F(9.5f);
            err.Bounds = new Rectangle(x + Theme.S(4), Theme.S(246), w, Theme.S(22));
            card.Controls.Add(err);

            PillButton ok = new PillButton("Accedi");
            ok.BackColor = Theme.Surface;
            ok.Bounds = new Rectangle(x, Theme.S(282), w, Theme.S(44));
            ok.Click += delegate { TryLogin(); };
            card.Controls.Add(ok);

            user.Box.KeyDown += delegate(object s, KeyEventArgs e)
            {
                if (e.KeyCode == Keys.Enter) { e.SuppressKeyPress = true; pass.Box.Focus(); }
            };
            pass.Box.KeyDown += delegate(object s, KeyEventArgs e)
            {
                if (e.KeyCode == Keys.Enter) { e.SuppressKeyPress = true; TryLogin(); }
            };
            Shown += delegate { user.Box.Focus(); };
        }

        void TryLogin()
        {
            if (user.Box.Text.Trim() == Config.AdminUser && pass.Box.Text == Config.AdminPassword)
            {
                DialogResult = DialogResult.OK;
                return;
            }
            err.Text = "Utente o password non corretti";
            pass.Box.Clear();
            pass.Box.Focus();
        }
    }

    // ---------------------------------------------------------------- finestra principale

    class MainForm : Form
    {
        readonly InputBox search = new InputBox("Cerca operatore (es. 609 o nome)", false);
        readonly OperatorList list = new OperatorList();
        readonly CardView card = new CardView();
        readonly Label subtitle = new Label();
        readonly Timer timer = new Timer();

        List<Operatore> all = new List<Operatore>();
        string filePath;
        DateTime lastWrite;
        long lastSize = -1;
        string selectedCode;
        bool filling;

        public MainForm(string pathArg)
        {
            AutoScaleMode = AutoScaleMode.None;
            Text = "Password Operatori";
            Icon = Theme.AppIcon();
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Theme.Bg;
            Font = Theme.F(10f);
            Rectangle wa = Screen.PrimaryScreen.WorkingArea;
            ClientSize = new Size(Math.Min(Theme.S(600), wa.Width - 40), Math.Min(Theme.S(760), wa.Height - 60));
            MinimumSize = new Size(Theme.S(480), Theme.S(560));
            Padding = new Padding(Theme.S(24), Theme.S(16), Theme.S(24), Theme.S(24));

            // header
            Panel header = new Panel();
            header.Dock = DockStyle.Top;
            header.Height = Theme.S(64);

            Label title = new Label();
            title.Text = "Password Operatori";
            title.Font = Theme.F(17f);
            title.ForeColor = Theme.Text;
            title.AutoSize = true;
            title.Location = new Point(0, 0);
            header.Controls.Add(title);

            subtitle.Font = Theme.F(9f);
            subtitle.ForeColor = Theme.TextSecondary;
            subtitle.AutoEllipsis = true;
            subtitle.Cursor = Cursors.Hand;
            subtitle.Location = new Point(Theme.S(2), Theme.S(38));
            subtitle.Size = new Size(Theme.S(300), Theme.S(20));
            subtitle.Click += delegate { ChooseFile(); };
            new ToolTip().SetToolTip(subtitle, "Clic per scegliere un altro file");
            header.Controls.Add(subtitle);

            PillButton refresh = new PillButton("Aggiorna");
            refresh.Primary = false;
            refresh.BackColor = Theme.Bg;
            refresh.Size = new Size(Theme.S(104), Theme.S(36));
            refresh.Click += delegate { Reload(true, true); };
            header.Controls.Add(refresh);

            header.Resize += delegate
            {
                refresh.Location = new Point(header.Width - refresh.Width, Theme.S(6));
                subtitle.Width = Math.Max(Theme.S(100), header.Width - refresh.Width - Theme.S(12));
            };

            search.BackColor = Theme.Bg;
            search.Dock = DockStyle.Top;
            search.Height = Theme.S(52);
            search.Box.TextChanged += delegate { ApplyFilter(false); };
            search.Box.KeyDown += OnSearchKey;

            card.BackColor = Theme.Bg;
            card.Dock = DockStyle.Top;
            card.Height = Theme.S(250);

            RoundCard listCard = new RoundCard();
            listCard.BackColor = Theme.Bg;
            listCard.Dock = DockStyle.Fill;
            listCard.Padding = new Padding(Theme.S(6), Theme.S(10), Theme.S(6), Theme.S(10));
            list.Dock = DockStyle.Fill;
            list.SelectedIndexChanged += delegate
            {
                if (filling) return;
                Operatore op = list.SelectedItem as Operatore;
                if (op == null) return;
                selectedCode = op.Codice;
                card.Message = null;
                card.Operatore = op;
            };
            listCard.Controls.Add(list);

            // Dock: il primo aggiunto (Fill) viene disposto per ultimo.
            Controls.Add(listCard);
            Controls.Add(Spacer(16));
            Controls.Add(card);
            Controls.Add(Spacer(16));
            Controls.Add(search);
            Controls.Add(header);

            filePath = ResolvePath(pathArg);

            timer.Interval = Config.RefreshMs;
            timer.Tick += delegate { Reload(false, true); };

            Load += delegate { Reload(true, false); timer.Start(); };
            Shown += delegate { search.Box.Focus(); };
        }

        static Panel Spacer(int h)
        {
            Panel p = new Panel();
            p.Dock = DockStyle.Top;
            p.Height = Theme.S(h);
            return p;
        }

        static string ResolvePath(string arg)
        {
            if (!string.IsNullOrEmpty(arg) && File.Exists(arg)) return Path.GetFullPath(arg);
            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] dirs = { Config.DefaultDir, exeDir };
            foreach (string dir in dirs)
            {
                string p = Path.Combine(dir, Config.FileName);
                if (File.Exists(p)) return p;
            }
            foreach (string dir in dirs)
            {
                try
                {
                    if (!Directory.Exists(dir)) continue;
                    string[] found = Directory.GetFiles(dir, "M_CTL*.DAT");
                    if (found.Length > 0) return found[0];
                }
                catch { }
            }
            return Path.Combine(Config.DefaultDir, Config.FileName);
        }

        void ChooseFile()
        {
            using (OpenFileDialog dlg = new OpenFileDialog())
            {
                dlg.Title = "Seleziona il file " + Config.FileName;
                dlg.Filter = "File M_CTL (M_CTL*.DAT)|M_CTL*.DAT|Tutti i file (*.*)|*.*";
                try
                {
                    string dir = Path.GetDirectoryName(filePath);
                    if (Directory.Exists(dir)) dlg.InitialDirectory = dir;
                }
                catch { }
                if (dlg.ShowDialog(this) == DialogResult.OK)
                {
                    filePath = dlg.FileName;
                    Reload(true, false);
                }
            }
        }

        void Reload(bool force, bool keepScroll)
        {
            if (!File.Exists(filePath))
            {
                all = new List<Operatore>();
                lastSize = -1;
                subtitle.Text = filePath + "  ·  file non trovato (clic per sceglierlo)";
                card.Message = "File " + Config.FileName + " non trovato.\nClic sul percorso in alto per selezionarlo.";
                ApplyFilter(keepScroll);
                return;
            }

            try
            {
                FileInfo fi = new FileInfo(filePath);
                if (!force && fi.LastWriteTimeUtc == lastWrite && fi.Length == lastSize) return;
                all = MctlParser.Load(filePath);
                lastWrite = fi.LastWriteTimeUtc;
                lastSize = fi.Length;
                subtitle.Text = filePath + "  ·  " + all.Count + " operatori  ·  aggiornato alle " + DateTime.Now.ToString("HH:mm:ss");
                if (card.Message != null && card.Message.StartsWith("File ")) card.Message = null;
            }
            catch (Exception ex)
            {
                subtitle.Text = "Errore di lettura: " + ex.Message;
                return;
            }
            ApplyFilter(keepScroll);
        }

        static bool Matches(Operatore op, string q)
        {
            if (q.Length == 0) return true;
            if (MctlParser.IsDigits(q) && op.CodiceBreve.StartsWith(Operatore.TrimZeros(q))) return true;
            return op.Nome.IndexOf(q, StringComparison.OrdinalIgnoreCase) >= 0;
        }

        void ApplyFilter(bool keepScroll)
        {
            string q = search.Box.Text.Trim();
            List<Operatore> res = all.FindAll(delegate(Operatore o) { return Matches(o, q); });

            Operatore sel = null;
            if (q.Length > 0)
            {
                if (MctlParser.IsDigits(q))
                {
                    string code = Operatore.TrimZeros(q);
                    sel = res.Find(delegate(Operatore o) { return o.CodiceBreve == code; });
                }
                if (sel == null && res.Count == 1) sel = res[0];
            }
            if (sel == null && selectedCode != null)
                sel = res.Find(delegate(Operatore o) { return o.Codice == selectedCode; });

            int top = list.TopIndex;
            filling = true;
            list.BeginUpdate();
            list.Items.Clear();
            foreach (Operatore o in res) list.Items.Add(o);
            if (sel != null) list.SelectedItem = sel;
            if (keepScroll && list.Items.Count > 0) list.TopIndex = Math.Min(top, list.Items.Count - 1);
            list.EndUpdate();
            filling = false;

            if (!File.Exists(filePath)) return;
            if (sel != null)
            {
                selectedCode = sel.Codice;
                card.Message = null;
                card.Operatore = sel;
            }
            else if (q.Length > 0)
            {
                card.Operatore = null;
                card.Message = res.Count == 0
                    ? "Nessun operatore trovato per \u201C" + q + "\u201D."
                    : res.Count + " operatori trovati: selezionane uno dall'elenco.";
            }
            else
            {
                card.Operatore = null;
                card.Message = null;
            }
        }

        void OnSearchKey(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                e.SuppressKeyPress = true;
                if (list.SelectedIndex < 0 && list.Items.Count > 0) list.SelectedIndex = 0;
            }
            else if (e.KeyCode == Keys.Down && list.Items.Count > 0)
            {
                e.SuppressKeyPress = true;
                list.Focus();
                if (list.SelectedIndex < 0) list.SelectedIndex = 0;
            }
            else if (e.KeyCode == Keys.Escape)
            {
                e.SuppressKeyPress = true;
                search.Box.Clear();
            }
        }
    }

    // ---------------------------------------------------------------- avvio

    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try { if (Environment.OSVersion.Platform == PlatformID.Win32NT && Environment.OSVersion.Version.Major >= 6) Native.SetProcessDPIAware(); }
            catch { }
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            using (Graphics g = Graphics.FromHwnd(IntPtr.Zero)) Theme.Scale = Math.Max(1f, g.DpiX / 96f);

            using (LoginForm login = new LoginForm())
            {
                if (login.ShowDialog() != DialogResult.OK) return;
            }
            Application.Run(new MainForm(args.Length > 0 ? args[0] : null));
        }
    }
}
