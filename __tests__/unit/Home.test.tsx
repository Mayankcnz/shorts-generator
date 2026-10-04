import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

const jobId = "017f22e2-79b0-4b72-ab85-6758c8f3666a";
const response = (body: unknown) => ({ ok: true, json: async () => body });

async function submit() {
  render(<Home />);
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "https://youtu.be/abc123" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Analyze Video" }));
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("job progress polling", () => {
  it("prevents another submission while the first status request is pending", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ jobId, status: "queued" }))
      .mockImplementationOnce(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);
    await submit();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("polls until completion, displays results, and stops polling", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ jobId, status: "queued" }))
      .mockResolvedValueOnce(response({ id: jobId, status: "processing", clips: [] }))
      .mockResolvedValueOnce(response({
        id: jobId, status: "completed", transcript: "Finished transcript", clips: [],
      }));
    vi.stubGlobal("fetch", fetchMock);
    await submit();
    expect(screen.getByText("Job status: processing")).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(screen.getByText("Job status: completed")).toBeTruthy();
    expect(screen.getByText("Finished transcript")).toBeTruthy();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
