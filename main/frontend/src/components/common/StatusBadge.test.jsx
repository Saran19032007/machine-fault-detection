import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the HIGH condition prominently with text, not color alone", () => {
    render(<StatusBadge status="high" />);
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("renders NORMAL condition", () => {
    render(<StatusBadge status="normal" />);
    expect(screen.getByText("NORMAL")).toBeInTheDocument();
  });
});
