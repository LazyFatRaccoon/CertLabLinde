import { v4 as uuid } from "uuid";

export const FIELD_DEFAULT = {
  bold: false,
  color: "#000000",
  demo: "",
  fixed: false,
  font: "Arial",
  fontSize: 16,
  id: null,
  imageUrl: "",
  italic: false,
  label: "",
  render: true,
  size: 100,
  type: "text",
  underline: false,
  x: 0,
  y: 0,
};

export const normalizeField = (f = {}) => ({
  ...FIELD_DEFAULT,
  ...f,
  id: f.id ?? uuid(),
});
