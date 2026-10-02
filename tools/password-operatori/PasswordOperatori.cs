// Password Operatori - legge M_CTL999.DAT e mostra password, cassa e stato degli operatori.
// Stile: design system Terya (#F2F2F2, #020609, accento #EC6906, Roboto, forme pill, nessuna ombra).
// Singolo file, compatibile con il compilatore C# 5 incluso in .NET Framework 4.x: vedi build.bat.

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Globalization;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

[assembly: AssemblyTitle("Password Operatori")]
[assembly: AssemblyProduct("Password Operatori")]
[assembly: AssemblyVersion("1.1.0.0")]

namespace PasswordOperatori
{
    static class Config
    {
        // Credenziali della responsabile (provvisorie).
        public const string AdminUser = "admin";
        public const string AdminPassword = "admin";

        public const string AppName = "Password Operatori";
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
                    case OpState.Paused: return Theme.Amber;
                    case OpState.Closed: return Theme.Red;
                    default: return Theme.Off;
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
                    case OpState.Paused: return Theme.AmberText;
                    case OpState.Closed: return Theme.RedText;
                    default: return Theme.Gray;
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

    // ---------------------------------------------------------------- design system Terya

    enum W { Regular, Medium, Bold }

    static class Theme
    {
        public static float Scale = 1f;
        public static int S(float v) { return (int)Math.Round(v * Scale); }

        public static readonly Color Ink = Color.FromArgb(2, 6, 9);              // #020609
        public static readonly Color Bg = Color.FromArgb(242, 242, 242);         // #F2F2F2
        public static readonly Color Surface = Color.White;
        public static readonly Color Muted = Color.FromArgb(243, 244, 246);      // #F3F4F6
        public static readonly Color Border = Color.FromArgb(199, 199, 201);     // #C7C7C9
        public static readonly Color Divider = Color.FromArgb(224, 224, 224);    // #E0E0E0
        public static readonly Color Gray = Color.FromArgb(115, 115, 115);       // #737373
        public static readonly Color GrayDark = Color.FromArgb(87, 87, 87);      // #575757
        public static readonly Color Accent = Color.FromArgb(236, 105, 6);       // #EC6906
        public static readonly Color AccentDark = Color.FromArgb(149, 65, 3);    // #954103
        public static readonly Color AccentSoft = Color.FromArgb(253, 238, 226);

        public static readonly Color Green = Color.FromArgb(34, 164, 71);
        public static readonly Color Amber = Color.FromArgb(245, 166, 35);
        public static readonly Color Red = Color.FromArgb(229, 56, 59);
        public static readonly Color Off = Color.FromArgb(181, 181, 181);
        public static readonly Color GreenText = Color.FromArgb(19, 115, 51);
        public static readonly Color AmberText = Color.FromArgb(138, 83, 0);
        public static readonly Color RedText = Color.FromArgb(179, 38, 30);

        static readonly Dictionary<string, Font> fonts = new Dictionary<string, Font>();

        public static Font F(float size) { return F(size, W.Regular); }

        public static Font F(float size, W weight)
        {
            string key = size.ToString(CultureInfo.InvariantCulture) + weight;
            Font f;
            if (!fonts.TryGetValue(key, out f))
            {
                f = Fonts.Create(size, weight);
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

        public static void FillRound(Graphics g, Color c, RectangleF r, float radius)
        {
            using (GraphicsPath p = Round(r, radius))
            using (SolidBrush b = new SolidBrush(c))
                g.FillPath(b, p);
        }

        public static void StrokeRound(Graphics g, Color c, float width, RectangleF r, float radius)
        {
            using (GraphicsPath p = Round(r, radius))
            using (Pen pen = new Pen(c, width))
                g.DrawPath(pen, p);
        }

        public static void Dot(Graphics g, Color c, float cx, float cy, float d)
        {
            using (SolidBrush b = new SolidBrush(c)) g.FillEllipse(b, cx - d / 2, cy - d / 2, d, d);
        }

        public static void Led(Graphics g, Color c, float cx, float cy, float d, bool halo)
        {
            if (halo) Dot(g, Color.FromArgb(48, c), cx, cy, d * 1.9f);
            Dot(g, c, cx, cy, d);
        }

        // Chiave stilizzata (icona dell'app) nel quadrato r.
        public static void Key(Graphics g, Color c, RectangleF r)
        {
            float u = r.Width / 32f;
            using (Pen p = new Pen(c, 3f * u))
            {
                p.StartCap = p.EndCap = LineCap.Round;
                g.DrawEllipse(p, r.X + 6.5f * u, r.Y + 11f * u, 10f * u, 10f * u);
                g.DrawLine(p, r.X + 16.5f * u, r.Y + 16f * u, r.X + 26f * u, r.Y + 16f * u);
                g.DrawLine(p, r.X + 22.5f * u, r.Y + 16f * u, r.X + 22.5f * u, r.Y + 20.5f * u);
                g.DrawLine(p, r.X + 26f * u, r.Y + 16f * u, r.X + 26f * u, r.Y + 19f * u);
            }
        }

        public static void SearchGlyph(Graphics g, Color c, RectangleF r)
        {
            float u = r.Width / 24f;
            using (Pen p = new Pen(c, 2.2f * u))
            {
                p.StartCap = p.EndCap = LineCap.Round;
                g.DrawEllipse(p, r.X + 4 * u, r.Y + 4 * u, 12 * u, 12 * u);
                g.DrawLine(p, r.X + 14.5f * u, r.Y + 14.5f * u, r.X + 20 * u, r.Y + 20 * u);
            }
        }

        public static void Logo(Graphics g, RectangleF r)
        {
            SmoothingMode old = g.SmoothingMode;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            using (SolidBrush b = new SolidBrush(Accent)) g.FillEllipse(b, r);
            float k = r.Width * 0.72f;
            Key(g, Color.White, new RectangleF(r.X + (r.Width - k) / 2, r.Y + (r.Height - k) / 2, k, k));
            g.SmoothingMode = old;
        }

        public static Icon AppIcon()
        {
            try
            {
                Icon ic = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                if (ic != null && ic.Width > 0) return ic;
            }
            catch { }
            try
            {
                Bitmap bmp = new Bitmap(32, 32);
                using (Graphics g = Graphics.FromImage(bmp)) Logo(g, new RectangleF(1, 1, 30, 30));
                return Icon.FromHandle(bmp.GetHicon());
            }
            catch { return null; }
        }

        public static Size Measure(Graphics g, string text, Font f)
        {
            return TextRenderer.MeasureText(g, text, f, Size.Empty, TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix | TextFormatFlags.SingleLine);
        }

        public static void Text(Graphics g, string text, Font f, Rectangle r, Color c, TextFormatFlags extra)
        {
            TextRenderer.DrawText(g, text, f, r, c, Line | extra);
        }

        public const TextFormatFlags Line = TextFormatFlags.NoPrefix | TextFormatFlags.SingleLine |
            TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis | TextFormatFlags.NoPadding;
    }

    // Roboto incorporato nell'exe: niente da installare sui server.
    static class Fonts
    {
        static readonly PrivateFontCollection pfc = new PrivateFontCollection();
        static FontFamily regular, medium;

        public static void Load()
        {
            string[] names = { "Roboto-Regular.ttf", "Roboto-Medium.ttf", "Roboto-Bold.ttf" };
            // Su Mono i font in memoria non sono affidabili: si usa Roboto di sistema, se c'e'.
            if (Type.GetType("Mono.Runtime") != null) return;
            try
            {
                Assembly asm = Assembly.GetExecutingAssembly();
                foreach (string n in names)
                {
                    using (Stream s = asm.GetManifestResourceStream(n))
                    {
                        if (s == null) continue;
                        byte[] data = new byte[s.Length];
                        int read = 0;
                        while (read < data.Length)
                        {
                            int r = s.Read(data, read, data.Length - read);
                            if (r <= 0) break;
                            read += r;
                        }
                        // La memoria resta allocata per tutta la vita del processo, come richiesto da AddMemoryFont.
                        IntPtr mem = Marshal.AllocCoTaskMem(data.Length);
                        Marshal.Copy(data, 0, mem, data.Length);
                        pfc.AddMemoryFont(mem, data.Length);
                        uint count = 0;
                        try { Native.AddFontMemResourceEx(mem, (uint)data.Length, IntPtr.Zero, ref count); }
                        catch { }
                    }
                }
                foreach (FontFamily ff in pfc.Families)
                {
                    if (ff.Name == "Roboto") regular = ff;
                    else if (ff.Name == "Roboto Medium") medium = ff;
                }
            }
            catch { regular = medium = null; }
        }

        public static Font Create(float size, W weight)
        {
            try
            {
                if (weight == W.Medium && medium != null) return new Font(medium, size, FontStyle.Regular);
                if (regular != null)
                {
                    bool bold = weight == W.Bold && regular.IsStyleAvailable(FontStyle.Bold);
                    return new Font(regular, size, bold ? FontStyle.Bold : FontStyle.Regular);
                }
            }
            catch { }
            Font sys = weight == W.Medium ? new Font("Roboto Medium", size)
                : new Font("Roboto", size, weight == W.Bold ? FontStyle.Bold : FontStyle.Regular);
            if (sys.Name.StartsWith("Roboto")) return sys;
            sys.Dispose();
            if (weight == W.Medium) return new Font("Segoe UI Semibold", size);
            return new Font("Segoe UI", size, weight == W.Bold ? FontStyle.Bold : FontStyle.Regular);
        }
    }

    static class Native
    {
        [DllImport("user32.dll")]
        public static extern bool SetProcessDPIAware();

        [DllImport("gdi32.dll")]
        public static extern IntPtr AddFontMemResourceEx(IntPtr pbFont, uint cbFont, IntPtr pdv, ref uint pcFonts);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, string lParam);

        public static void SetCue(TextBox tb, string cue)
        {
            try { SendMessage(tb.Handle, 0x1501 /* EM_SETCUEBANNER */, (IntPtr)1, cue); }
            catch { }
        }
    }

    // ---------------------------------------------------------------- controlli base

    class Canvas : Control
    {
        public Canvas()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint |
                     ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        }

        protected Graphics Begin(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.Clear(BackColor);
            g.SmoothingMode = SmoothingMode.AntiAlias;
            return g;
        }
    }

    enum PillStyle { Primary, OutlineLight, Outline }

    class PillButton : Canvas
    {
        public PillStyle Style;
        bool hover, down;

        public PillButton(string text, PillStyle style)
        {
            Text = text;
            Style = style;
            Cursor = Cursors.Hand;
            Font = Theme.F(10.5f, W.Bold);
        }

        protected override void OnMouseEnter(EventArgs e) { base.OnMouseEnter(e); hover = true; Invalidate(); }
        protected override void OnMouseLeave(EventArgs e) { base.OnMouseLeave(e); hover = false; down = false; Invalidate(); }
        protected override void OnMouseDown(MouseEventArgs e) { base.OnMouseDown(e); down = true; Invalidate(); }
        protected override void OnMouseUp(MouseEventArgs e) { base.OnMouseUp(e); down = false; Invalidate(); }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = Begin(e);
            RectangleF r = new RectangleF(0.5f, 0.5f, Width - 1.5f, Height - 1.5f);
            float rad = r.Height / 2;
            Color text;
            switch (Style)
            {
                case PillStyle.Primary:
                    Theme.FillRound(g, hover || down ? Theme.AccentDark : Theme.Accent, r, rad);
                    text = Color.White;
                    break;
                case PillStyle.OutlineLight:
                    if (hover) Theme.FillRound(g, Color.FromArgb(28, Color.White), r, rad);
                    Theme.StrokeRound(g, Color.White, 1f, r, rad);
                    text = Color.White;
                    break;
                default:
                    if (hover) Theme.FillRound(g, Theme.Muted, r, rad);
                    Theme.StrokeRound(g, Theme.Border, 1f, r, rad);
                    text = Theme.Ink;
                    break;
            }
            TextRenderer.DrawText(g, Text, Font, ClientRectangle, text,
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPrefix | TextFormatFlags.SingleLine);
        }
    }

    // Campo di testo a pillola, con icona di ricerca opzionale.
    class InputBox : Canvas
    {
        public readonly TextBox Box = new TextBox();
        readonly bool searchIcon;
        bool focused;

        public InputBox(string cue, bool password, bool searchIcon, float fontSize)
        {
            this.searchIcon = searchIcon;
            Cursor = Cursors.IBeam;
            Box.BorderStyle = BorderStyle.None;
            Box.Font = Theme.F(fontSize);
            Box.BackColor = Theme.Surface;
            Box.ForeColor = Theme.Ink;
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
            int left = searchIcon ? Height - Theme.S(4) : Height / 2;
            int right = Height / 2;
            Box.SetBounds(left, (Height - Box.Height) / 2, Math.Max(10, Width - left - right), Box.Height);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = Begin(e);
            float w = focused ? 2f : 1f;
            RectangleF r = new RectangleF(w / 2 + 0.5f, w / 2 + 0.5f, Width - w - 1.5f, Height - w - 1.5f);
            Theme.FillRound(g, Theme.Surface, r, r.Height / 2);
            Theme.StrokeRound(g, focused ? Theme.Accent : Theme.Border, w, r, r.Height / 2);
            if (searchIcon)
            {
                float s = Theme.S(22);
                Theme.SearchGlyph(g, focused ? Theme.Accent : Theme.Gray, new RectangleF(Height / 2f - s / 2 + Theme.S(4), (Height - s) / 2f, s, s));
            }
        }
    }

    // ---------------------------------------------------------------- barra superiore

    class HeaderBar : Canvas
    {
        public readonly PillButton RefreshButton = new PillButton("Aggiorna", PillStyle.OutlineLight);
        string status = "";

        public HeaderBar()
        {
            BackColor = Theme.Ink;
            RefreshButton.BackColor = Theme.Ink;
            RefreshButton.Font = Theme.F(9.5f, W.Bold);
            RefreshButton.Size = new Size(Theme.S(112), Theme.S(38));
            Controls.Add(RefreshButton);
        }

        public string Status { get { return status; } set { status = value; Invalidate(); } }

        protected override void OnLayout(LayoutEventArgs e)
        {
            base.OnLayout(e);
            RefreshButton.Location = new Point(Width - Theme.S(28) - RefreshButton.Width, (Height - RefreshButton.Height) / 2);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = Begin(e);
            int pad = Theme.S(28);
            int logo = Theme.S(36);
            Theme.Logo(g, new RectangleF(pad, (Height - logo) / 2f, logo, logo));

            Font tf = Theme.F(15f, W.Bold);
            int tx = pad + logo + Theme.S(14);
            Size ts = Theme.Measure(g, Config.AppName, tf);
            int ty = (Height - ts.Height) / 2;
            TextRenderer.DrawText(g, Config.AppName, tf, new Point(tx, ty), Color.White, TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix);
            // punto arancione, come nel logotipo Terya
            float d = Theme.S(7);
            Theme.Dot(g, Theme.Accent, tx + ts.Width + Theme.S(4) + d / 2, ty + ts.Height - d * 0.9f, d);

            int sx = tx + ts.Width + Theme.S(30);
            int sw = RefreshButton.Left - Theme.S(18) - sx;
            if (sw > Theme.S(60))
                Theme.Text(g, status, Theme.F(9f), new Rectangle(sx, 0, sw, Height), Color.FromArgb(160, Color.White), TextFormatFlags.Right);
        }
    }

    // ---------------------------------------------------------------- filtri di stato

    class FilterBar : Canvas
    {
        static readonly string[] names = { "Tutti", "Aperti", "In pausa", "Chiusi" };
        static readonly Color[] dots = { Color.Empty, Theme.Green, Theme.Amber, Theme.Red };
        public readonly int[] Counts = new int[4];
        readonly Rectangle[] rects = new Rectangle[4];
        int selected;

        public event EventHandler Changed;

        public int Selected { get { return selected; } }

        public void SetCounts(int all, int open, int paused, int closed)
        {
            Counts[0] = all; Counts[1] = open; Counts[2] = paused; Counts[3] = closed;
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = Begin(e);
            Font nf = Theme.F(9.5f, W.Bold);
            Font cf = Theme.F(9.5f);
            int x = 0;
            int h = Height - 1;
            for (int i = 0; i < names.Length; i++)
            {
                string count = Counts[i].ToString();
                Size ns = Theme.Measure(g, names[i], nf);
                Size cs = Theme.Measure(g, count, cf);
                int dotW = dots[i] == Color.Empty ? 0 : Theme.S(16);
                int w = Theme.S(18) + dotW + ns.Width + Theme.S(7) + cs.Width + Theme.S(18);
                rects[i] = new Rectangle(x, 0, w, h);
                RectangleF r = new RectangleF(x + 0.5f, 0.5f, w - 1, h - 1);
                bool sel = i == selected;
                if (sel) Theme.FillRound(g, Theme.Ink, r, r.Height / 2);
                else
                {
                    Theme.FillRound(g, Theme.Surface, r, r.Height / 2);
                    Theme.StrokeRound(g, Theme.Border, 1f, r, r.Height / 2);
                }
                int cx = x + Theme.S(18);
                if (dotW > 0)
                {
                    Theme.Dot(g, dots[i], cx + Theme.S(4), h / 2f, Theme.S(8));
                    cx += dotW;
                }
                Theme.Text(g, names[i], nf, new Rectangle(cx, 0, ns.Width + 2, h), sel ? Color.White : Theme.Ink, 0);
                cx += ns.Width + Theme.S(7);
                Theme.Text(g, count, cf, new Rectangle(cx, 0, cs.Width + 2, h), sel ? Color.FromArgb(170, Color.White) : Theme.Gray, 0);
                x += w + Theme.S(8);
            }
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            Cursor = Hit(e.Location) >= 0 ? Cursors.Hand : Cursors.Default;
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            int i = Hit(e.Location);
            if (i < 0 || i == selected) return;
            selected = i;
            Invalidate();
            if (Changed != null) Changed(this, EventArgs.Empty);
        }

        int Hit(Point p)
        {
            for (int i = 0; i < rects.Length; i++) if (rects[i].Contains(p)) return i;
            return -1;
        }

        public bool Accepts(Operatore op)
        {
            switch (selected)
            {
                case 1: return op.Stato == OpState.Open;
                case 2: return op.Stato == OpState.Paused;
                case 3: return op.Stato == OpState.Closed;
                default: return true;
            }
        }
    }

    // ---------------------------------------------------------------- scheda risultato

    class ResultCard : Canvas
    {
        Operatore op;
        string message;
        Rectangle pwRect;
        bool pwHover, copied;
        readonly Timer copyTimer = new Timer();

        public ResultCard()
        {
            copyTimer.Interval = 1800;
            copyTimer.Tick += delegate { copyTimer.Stop(); copied = false; Invalidate(); };
        }

        public Operatore Operatore
        {
            get { return op; }
            set
            {
                if (op == null || value == null || op.Codice != value.Codice) copied = false;
                op = value;
                Invalidate();
            }
        }

        public string Message { get { return message; } set { message = value; Invalidate(); } }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = Begin(e);
            RectangleF card = new RectangleF(0.5f, 0.5f, Width - 1.5f, Height - 1.5f);
            Theme.FillRound(g, Theme.Surface, card, Theme.S(24));

            int pad = Theme.S(30);
            int x = pad, y = pad, w = Width - 2 * pad;

            if (op == null || message != null)
            {
                pwRect = Rectangle.Empty;
                int c = Theme.S(60);
                int top = Height / 2 - Theme.S(70);
                Theme.Dot(g, Theme.AccentSoft, Width / 2f, top + c / 2f, c);
                float s = Theme.S(26);
                Theme.SearchGlyph(g, Theme.Accent, new RectangleF(Width / 2f - s / 2, top + (c - s) / 2f, s, s));
                string title = message == null ? "Cerca un operatore" : "Nessun risultato";
                string sub = message ?? "Scrivi il codice (es. 609) o il nome per vedere password, cassa e stato.";
                if (message != null && message.StartsWith("File ")) title = "File non trovato";
                else if (message != null && message.Contains("trovati")) title = "Più operatori trovati";
                Theme.Text(g, title, Theme.F(14f, W.Bold), new Rectangle(x, top + c + Theme.S(16), w, Theme.S(30)), Theme.Ink, TextFormatFlags.HorizontalCenter);
                TextRenderer.DrawText(g, sub, Theme.F(10f), new Rectangle(x + Theme.S(20), top + c + Theme.S(50), w - Theme.S(40), Theme.S(48)), Theme.Gray,
                    TextFormatFlags.HorizontalCenter | TextFormatFlags.WordBreak | TextFormatFlags.NoPrefix);
                return;
            }

            // riga 1: chip di stato + nome
            Font chipF = Theme.F(9.5f, W.Bold);
            string chip = op.StatoBreve;
            Size cs = Theme.Measure(g, chip, chipF);
            int chipH = Theme.S(32);
            int chipW = cs.Width + Theme.S(46);
            Theme.FillRound(g, Color.FromArgb(op.Stato == OpState.NeverOpened ? 40 : 30, op.Led), new RectangleF(x, y, chipW, chipH), chipH / 2f);
            Theme.Led(g, op.Led, x + Theme.S(18), y + chipH / 2f, Theme.S(10), op.Stato != OpState.NeverOpened);
            Theme.Text(g, chip, chipF, new Rectangle(x + Theme.S(32), y, cs.Width + 4, chipH), op.TextColor, 0);
            Theme.Text(g, op.Nome + "   ·   cod. " + op.Codice, Theme.F(9.5f), new Rectangle(x + chipW + Theme.S(12), y, w - chipW - Theme.S(12), chipH),
                Theme.Gray, TextFormatFlags.Right);
            y += chipH + Theme.S(24);

            // riga 2: "La password dell'operatore 609 è" [09]
            Font hf = Theme.F(18f);
            Font pf = Theme.F(24f, W.Bold);
            string pre = "La password dell'operatore " + op.CodiceBreve + " è";
            Size ps = Theme.Measure(g, pre, hf);
            Size pws = Theme.Measure(g, op.Password, pf);
            int pillH = Theme.S(58);
            int pillW = Math.Max(pws.Width + Theme.S(48), Theme.S(100));
            if (ps.Width + Theme.S(16) + pillW > w)
            {
                hf = Theme.F(15f);
                ps = Theme.Measure(g, pre, hf);
            }
            Theme.Text(g, pre, hf, new Rectangle(x, y, ps.Width + 2, pillH), Theme.Ink, 0);
            pwRect = new Rectangle(x + ps.Width + Theme.S(16), y, pillW, pillH);
            Theme.FillRound(g, pwHover ? Theme.AccentDark : Theme.Accent, pwRect, pillH / 2f);
            TextRenderer.DrawText(g, op.Password, pf, pwRect, Color.White,
                TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.NoPrefix | TextFormatFlags.SingleLine);
            int hintX = pwRect.Right + Theme.S(14);
            if (hintX < x + w)
                Theme.Text(g, copied ? "Copiata ✓" : (pwHover ? "Clic per copiare" : ""), Theme.F(9f, copied ? W.Bold : W.Regular),
                    new Rectangle(hintX, y, x + w - hintX, pillH), copied ? Theme.GreenText : Theme.Gray, 0);
            y += pillH + Theme.S(14);

            // riga 3: messaggio di stato
            Theme.Text(g, op.Messaggio, Theme.F(13f, W.Medium), new Rectangle(x, y, w, Theme.S(30)), op.TextColor, 0);
            y += Theme.S(30) + Theme.S(20);

            using (Pen p = new Pen(Theme.Divider)) g.DrawLine(p, x, y, x + w, y);
            y += Theme.S(18);

            // riga 4: metriche
            string[] labels = { "CASSA", "DATA", "APERTURA", "CHIUSURA" };
            string[] values = { op.CassaFmt, op.DataFmt, op.AperturaFmt, op.ChiusuraFmt };
            int cw = w / labels.Length;
            for (int i = 0; i < labels.Length; i++)
            {
                int cx = x + i * cw;
                Theme.Text(g, labels[i], Theme.F(8f, W.Bold), new Rectangle(cx, y, cw - Theme.S(8), Theme.S(18)), Theme.Gray, 0);
                Theme.Text(g, values[i], Theme.F(18f, W.Bold), new Rectangle(cx, y + Theme.S(20), cw - Theme.S(8), Theme.S(36)), Theme.Ink, 0);
            }
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            bool h = op != null && message == null && pwRect.Contains(e.Location);
            Cursor = h ? Cursors.Hand : Cursors.Default;
            if (h != pwHover) { pwHover = h; Invalidate(); }
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            base.OnMouseLeave(e);
            if (pwHover) { pwHover = false; Invalidate(); }
        }

        protected override void OnMouseClick(MouseEventArgs e)
        {
            base.OnMouseClick(e);
            if (op == null || message != null || !pwRect.Contains(e.Location)) return;
            try { Clipboard.SetText(op.Password); } catch { return; }
            copied = true;
            copyTimer.Stop();
            copyTimer.Start();
            Invalidate();
        }
    }

    // ---------------------------------------------------------------- elenco operatori

    class ListCard : Panel
    {
        string title = "Operatori";
        string count = "";

        public ListCard()
        {
            SetStyle(ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint |
                     ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
            Padding = new Padding(Theme.S(8), Theme.S(60), Theme.S(8), Theme.S(12));
        }

        public void SetCount(int shown, int total)
        {
            count = shown == total ? total.ToString() : shown + " di " + total;
            Invalidate();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = e.Graphics;
            g.Clear(BackColor);
            g.SmoothingMode = SmoothingMode.AntiAlias;
            Theme.FillRound(g, Theme.Surface, new RectangleF(0.5f, 0.5f, Width - 1.5f, Height - 1.5f), Theme.S(24));
            int pad = Theme.S(28);
            Font tf = Theme.F(13f, W.Bold);
            Size ts = Theme.Measure(g, title, tf);
            Rectangle row = new Rectangle(pad, Theme.S(18), Width - 2 * pad, Theme.S(32));
            Theme.Text(g, title, tf, new Rectangle(row.X, row.Y, ts.Width + 2, row.Height), Theme.Ink, 0);
            Theme.Text(g, count, Theme.F(10f), new Rectangle(row.X + ts.Width + Theme.S(10), row.Y, Theme.S(200), row.Height), Theme.Gray, 0);
        }
    }

    class OperatorList : ListBox
    {
        public OperatorList()
        {
            DrawMode = DrawMode.OwnerDrawFixed;
            ItemHeight = Theme.S(54);
            BorderStyle = BorderStyle.None;
            IntegralHeight = false;
            BackColor = Theme.Surface;
            Font = Theme.F(10.5f);
        }

        protected override void OnDrawItem(DrawItemEventArgs e)
        {
            if (e.Index < 0 || e.Index >= Items.Count) return;
            Operatore op = (Operatore)Items[e.Index];
            Graphics g = e.Graphics;
            Rectangle r = e.Bounds;
            bool sel = (e.State & DrawItemState.Selected) != 0;

            using (SolidBrush b = new SolidBrush(BackColor)) g.FillRectangle(b, r);
            g.SmoothingMode = SmoothingMode.AntiAlias;
            if (sel)
            {
                Theme.FillRound(g, Theme.Muted, new RectangleF(r.X + Theme.S(8), r.Y + Theme.S(3), r.Width - Theme.S(16), r.Height - Theme.S(6)), Theme.S(14));
                Theme.FillRound(g, Theme.Accent, new RectangleF(r.X + Theme.S(8), r.Y + Theme.S(14), Theme.S(4), r.Height - Theme.S(28)), Theme.S(2));
            }
            else if (e.Index < Items.Count - 1)
            {
                using (Pen p = new Pen(Theme.Divider)) g.DrawLine(p, r.X + Theme.S(20), r.Bottom - 1, r.Right - Theme.S(20), r.Bottom - 1);
            }

            Theme.Led(g, op.Led, r.X + Theme.S(32), r.Y + r.Height / 2f, Theme.S(10), false);
            int x = r.X + Theme.S(52);
            int codeW = Theme.S(62);
            int statusW = Theme.S(170);
            Theme.Text(g, op.Codice, Theme.F(10.5f, W.Bold), new Rectangle(x, r.Y, codeW, r.Height), sel ? Theme.Accent : Theme.Ink, 0);
            Theme.Text(g, op.Nome, Theme.F(10.5f), new Rectangle(x + codeW, r.Y, r.Right - x - codeW - statusW - Theme.S(24), r.Height), Theme.Ink, 0);
            Theme.Text(g, op.StatoBreve, Theme.F(9.5f, W.Medium), new Rectangle(r.Right - statusW - Theme.S(24), r.Y, statusW, r.Height),
                op.TextColor, TextFormatFlags.Right);
        }
    }

    // ---------------------------------------------------------------- piede

    class FooterBar : Canvas
    {
        string path = "";
        Rectangle link;

        public event EventHandler ChangeFile;

        public string Path { get { return path; } set { path = value; Invalidate(); } }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = Begin(e);
            Font lf = Theme.F(9f, W.Bold);
            string lt = "Cambia file";
            Size ls = Theme.Measure(g, lt, lf);
            link = new Rectangle(Width - ls.Width - Theme.S(16), 0, ls.Width + Theme.S(12), Height);
            Theme.Text(g, lt, lf, link, Theme.Accent, TextFormatFlags.Right);
            Theme.Text(g, path, Theme.F(9f), new Rectangle(Theme.S(4), 0, link.Left - Theme.S(16), Height), Theme.Gray, TextFormatFlags.PathEllipsis);
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            Cursor = link.Contains(e.Location) ? Cursors.Hand : Cursors.Default;
        }

        protected override void OnMouseClick(MouseEventArgs e)
        {
            base.OnMouseClick(e);
            if (link.Contains(e.Location) && ChangeFile != null) ChangeFile(this, EventArgs.Empty);
        }
    }

    // ---------------------------------------------------------------- login

    class BrandPanel : Canvas
    {
        public BrandPanel() { BackColor = Theme.Ink; }

        protected override void OnPaint(PaintEventArgs e)
        {
            Graphics g = Begin(e);
            int pad = Theme.S(48);
            int logo = Theme.S(52);
            Theme.Logo(g, new RectangleF(pad, pad, logo, logo));

            Font big = Theme.F(30f, W.Bold);
            int y = Theme.S(170);
            Size s1 = Theme.Measure(g, "Password", big);
            TextRenderer.DrawText(g, "Password", big, new Point(pad, y), Color.White, TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix);
            y += (int)(s1.Height * 1.08f);
            Size s2 = Theme.Measure(g, "Operatori", big);
            TextRenderer.DrawText(g, "Operatori", big, new Point(pad, y), Color.White, TextFormatFlags.NoPadding | TextFormatFlags.NoPrefix);
            float d = Theme.S(11);
            Theme.Dot(g, Theme.Accent, pad + s2.Width + Theme.S(6) + d / 2, y + s2.Height - d * 0.95f, d);
            y += s2.Height + Theme.S(26);

            TextRenderer.DrawText(g, "Accesso riservato alla responsabile di cassa.", Theme.F(11.5f),
                new Rectangle(pad, y, Width - 2 * pad, Theme.S(70)), Color.FromArgb(160, Color.White), TextFormatFlags.WordBreak | TextFormatFlags.NoPrefix);

            Theme.Text(g, "Legge " + Config.FileName + " in sola lettura.", Theme.F(9f),
                new Rectangle(pad, Height - pad - Theme.S(20), Width - 2 * pad, Theme.S(20)), Color.FromArgb(110, Color.White), 0);
        }
    }

    class LoginForm : Form
    {
        readonly InputBox user = new InputBox("admin", false, false, 12f);
        readonly InputBox pass = new InputBox("••••••", true, false, 12f);
        readonly Label err = new Label();

        public LoginForm()
        {
            AutoScaleMode = AutoScaleMode.None;
            Text = Config.AppName + " · Accesso";
            Icon = Theme.AppIcon();
            FormBorderStyle = FormBorderStyle.FixedSingle;
            MaximizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Theme.Bg;
            Font = Theme.F(10f);
            ClientSize = new Size(Theme.S(880), Theme.S(540));

            BrandPanel brand = new BrandPanel();
            brand.Bounds = new Rectangle(0, 0, Theme.S(380), ClientSize.Height);
            Controls.Add(brand);

            int x = brand.Width + Theme.S(68);
            int w = ClientSize.Width - x - Theme.S(68);

            AddLabel("Accedi", Theme.F(24f, W.Bold), Theme.Ink, new Rectangle(x, Theme.S(92), w, Theme.S(48)));
            AddLabel("Inserisci le credenziali per continuare.", Theme.F(10.5f), Theme.Gray, new Rectangle(x, Theme.S(142), w, Theme.S(26)));

            AddLabel("Utente", Theme.F(9f, W.Bold), Theme.GrayDark, new Rectangle(x + Theme.S(4), Theme.S(196), w, Theme.S(22)));
            user.BackColor = Theme.Bg;
            user.Bounds = new Rectangle(x, Theme.S(222), w, Theme.S(54));
            Controls.Add(user);

            AddLabel("Password", Theme.F(9f, W.Bold), Theme.GrayDark, new Rectangle(x + Theme.S(4), Theme.S(292), w, Theme.S(22)));
            pass.BackColor = Theme.Bg;
            pass.Bounds = new Rectangle(x, Theme.S(318), w, Theme.S(54));
            Controls.Add(pass);

            err.ForeColor = Theme.RedText;
            err.BackColor = Theme.Bg;
            err.Font = Theme.F(9.5f, W.Medium);
            err.Bounds = new Rectangle(x + Theme.S(4), Theme.S(382), w, Theme.S(24));
            Controls.Add(err);

            PillButton ok = new PillButton("Accedi", PillStyle.Primary);
            ok.BackColor = Theme.Bg;
            ok.Font = Theme.F(12f, W.Bold);
            ok.Bounds = new Rectangle(x, Theme.S(420), w, Theme.S(56));
            ok.Click += delegate { TryLogin(); };
            Controls.Add(ok);

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

        void AddLabel(string text, Font font, Color color, Rectangle bounds)
        {
            Label l = new Label();
            l.Text = text;
            l.Font = font;
            l.ForeColor = color;
            l.BackColor = Theme.Bg;
            l.UseMnemonic = false;
            l.Bounds = bounds;
            Controls.Add(l);
        }

        void TryLogin()
        {
            if (user.Box.Text.Trim() == Config.AdminUser && pass.Box.Text == Config.AdminPassword)
            {
                DialogResult = DialogResult.OK;
                return;
            }
            err.Text = "Utente o password non corretti.";
            pass.Box.Clear();
            pass.Box.Focus();
        }
    }

    // ---------------------------------------------------------------- finestra principale

    class MainForm : Form
    {
        readonly HeaderBar header = new HeaderBar();
        readonly InputBox search = new InputBox("Cerca operatore per codice o nome (es. 609)", false, true, 13f);
        readonly FilterBar filters = new FilterBar();
        readonly ResultCard card = new ResultCard();
        readonly ListCard listCard = new ListCard();
        readonly OperatorList list = new OperatorList();
        readonly FooterBar footer = new FooterBar();
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
            Text = Config.AppName;
            Icon = Theme.AppIcon();
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Theme.Bg;
            Font = Theme.F(10f);
            KeyPreview = true;
            Rectangle wa = Screen.PrimaryScreen.WorkingArea;
            ClientSize = new Size(Math.Min(Theme.S(700), wa.Width - 40), Math.Min(Theme.S(920), wa.Height - 40));
            MinimumSize = new Size(Theme.S(600), Theme.S(700));

            header.Dock = DockStyle.Top;
            header.Height = Theme.S(76);
            header.RefreshButton.Click += delegate { Reload(true, true); };

            Panel body = new Panel();
            body.Dock = DockStyle.Fill;
            body.BackColor = Theme.Bg;
            body.Padding = new Padding(Theme.S(28), Theme.S(26), Theme.S(28), Theme.S(10));

            search.BackColor = Theme.Bg;
            search.Dock = DockStyle.Top;
            search.Height = Theme.S(58);
            search.Box.TextChanged += delegate { ApplyFilter(false); };
            search.Box.KeyDown += OnSearchKey;

            filters.BackColor = Theme.Bg;
            filters.Dock = DockStyle.Top;
            filters.Height = Theme.S(38);
            filters.Changed += delegate { ApplyFilter(false); };

            card.BackColor = Theme.Bg;
            card.Dock = DockStyle.Top;
            card.Height = Theme.S(318);

            listCard.BackColor = Theme.Bg;
            listCard.Dock = DockStyle.Fill;
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

            footer.BackColor = Theme.Bg;
            footer.Dock = DockStyle.Bottom;
            footer.Height = Theme.S(38);
            footer.ChangeFile += delegate { ChooseFile(); };

            // Dock: il primo aggiunto (Fill) viene disposto per ultimo.
            body.Controls.Add(listCard);
            body.Controls.Add(footer);
            body.Controls.Add(Spacer(18));
            body.Controls.Add(card);
            body.Controls.Add(Spacer(18));
            body.Controls.Add(filters);
            body.Controls.Add(Spacer(16));
            body.Controls.Add(search);

            Controls.Add(body);
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

        protected override bool ProcessCmdKey(ref Message msg, Keys keyData)
        {
            if (keyData == (Keys.Control | Keys.F)) { search.Box.Focus(); search.Box.SelectAll(); return true; }
            if (keyData == Keys.F5) { Reload(true, true); return true; }
            return base.ProcessCmdKey(ref msg, keyData);
        }

        static string ResolvePath(string arg)
        {
            if (!string.IsNullOrEmpty(arg) && File.Exists(arg)) return System.IO.Path.GetFullPath(arg);
            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            string[] dirs = { Config.DefaultDir, exeDir };
            foreach (string dir in dirs)
            {
                string p = System.IO.Path.Combine(dir, Config.FileName);
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
            return System.IO.Path.Combine(Config.DefaultDir, Config.FileName);
        }

        void ChooseFile()
        {
            using (OpenFileDialog dlg = new OpenFileDialog())
            {
                dlg.Title = "Seleziona il file " + Config.FileName;
                dlg.Filter = "File M_CTL (M_CTL*.DAT)|M_CTL*.DAT|Tutti i file (*.*)|*.*";
                try
                {
                    string dir = System.IO.Path.GetDirectoryName(filePath);
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
            footer.Path = filePath;
            if (!File.Exists(filePath))
            {
                all = new List<Operatore>();
                lastSize = -1;
                header.Status = "File non trovato";
                card.Message = "File " + Config.FileName + " non trovato. Usa \u201CCambia file\u201D in basso per selezionarlo.";
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
                header.Status = "Aggiornato alle " + DateTime.Now.ToString("HH:mm:ss");
                if (card.Message != null && card.Message.StartsWith("File ")) card.Message = null;
            }
            catch (Exception ex)
            {
                header.Status = "Errore di lettura: " + ex.Message;
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
            int open = 0, paused = 0, closed = 0;
            foreach (Operatore o in all)
            {
                if (o.Stato == OpState.Open) open++;
                else if (o.Stato == OpState.Paused) paused++;
                else if (o.Stato == OpState.Closed) closed++;
            }
            filters.SetCounts(all.Count, open, paused, closed);

            string q = search.Box.Text.Trim();
            List<Operatore> res = all.FindAll(delegate(Operatore o) { return Matches(o, q) && filters.Accepts(o); });
            listCard.SetCount(res.Count, all.Count);

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
                    ? "Nessun operatore corrisponde a \u201C" + q + "\u201D."
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
            Fonts.Load();

            using (LoginForm login = new LoginForm())
            {
                if (login.ShowDialog() != DialogResult.OK) return;
            }
            Application.Run(new MainForm(args.Length > 0 ? args[0] : null));
        }
    }
}
