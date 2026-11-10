import React from "react";
import ReactDOM from "react-dom/client";
import MapApp from "./MapApp";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

const root = document.getElementById("map-root");
if (!root) throw new Error("Missing #map-root element");
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <MapApp />
  </React.StrictMode>
);
