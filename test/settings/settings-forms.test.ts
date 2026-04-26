// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProviderKeyForm } from "@/components/settings/provider-key-form";
import { SettingsForm } from "@/components/settings/settings-form";
import { defaultAppSettings } from "@/modules/settings/domain/app-settings";
import { providerDescriptors } from "@/modules/settings/domain/provider-registry";

const routerMock = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

describe("settings forms", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("recovers settings submission state after fetch failures", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network unavailable.")),
    );
    render(
      createElement(SettingsForm, {
        currentSettings: defaultAppSettings,
        providers: [providerDescriptors.alpha_vantage],
      }),
    );
    const submitButton = screen.getByRole("button", {
      name: "Save settings",
    }) as HTMLButtonElement;

    // Act
    fireEvent.click(submitButton);

    // Assert
    await screen.findByText("Settings could not be saved.");
    await waitFor(() => expect(submitButton.disabled).toBe(false));
    expect(submitButton.textContent).toBe("Save settings");
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });

  it("recovers provider key submission state after fetch failures", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network unavailable.")),
    );
    render(
      createElement(ProviderKeyForm, {
        providerKeys: [],
        providers: [providerDescriptors.alpha_vantage],
      }),
    );
    const apiKeyInput = screen.getByLabelText("API key") as HTMLInputElement;
    fireEvent.change(apiKeyInput, {
      target: {
        value: "demo-provider-key",
      },
    });
    const submitButton = screen.getByRole("button", {
      name: "Save key",
    }) as HTMLButtonElement;

    // Act
    fireEvent.click(submitButton);

    // Assert
    await screen.findByText("Provider key action failed.");
    await waitFor(() => expect(submitButton.disabled).toBe(false));
    expect(submitButton.textContent).toBe("Save key");
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });
});
