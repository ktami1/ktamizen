"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#000", color: "#fff", fontFamily: "system-ui", margin: 0 }}>
        <main
          style={{
            minHeight: "100svh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 24,
            gap: 24,
          }}
        >
          <h1 style={{ fontWeight: 400, fontSize: 48, margin: 0 }}>something broke. not you.</h1>
          <button
            onClick={reset}
            style={{
              alignSelf: "flex-start",
              background: "#D30000",
              color: "#fff",
              border: 0,
              padding: "16px 24px",
              fontWeight: 700,
            }}
          >
            try again
          </button>
        </main>
      </body>
    </html>
  );
}
