import OsmMapClient from "./OsmMapClient";

export default function OsmPage() {
  return (
    <main
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <OsmMapClient />
    </main>
  );
}