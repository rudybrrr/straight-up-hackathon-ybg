import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          borderRadius: 10
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2
          }}
        >
          <span style={{ display: "block", width: "100%", height: 2, borderRadius: 999, background: "#ffffff" }} />
          <span style={{ display: "block", width: "80%", height: 2, borderRadius: 999, background: "#67e8f9" }} />
          <span style={{ display: "block", width: "60%", height: 2, borderRadius: 999, background: "#fcd34d" }} />
        </div>
      </div>
    ),
    size
  );
}
