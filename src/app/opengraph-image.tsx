import { ImageResponse } from "next/og";
export const alt = "DuitKita — Uang berdua, tercatat berdua";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "76px",
        background: "#f6f3ff",
        color: "#24143c",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 46,
          color: "#7c3aed",
          fontWeight: 700,
        }}
      >
        DuitKita.
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 60,
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.15,
        }}
      >
        Uang berdua,
        <br />
        tercatat berdua.
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 35,
          fontSize: 28,
          color: "#655575",
        }}
      >
        Catat keuangan. Atur budget. Wujudkan impian bersama.
      </div>
    </div>,
    size,
  );
}
