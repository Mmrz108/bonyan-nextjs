import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { LoginForm } from "@/components/auth/login-form";
import en from "../../../messages/en.json";

const login = vi.fn();
const replace = vi.fn();

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    login,
  }),
  isAuthApiError: (error: unknown) =>
    Boolean(
      error &&
        typeof error === "object" &&
        "status" in error &&
        typeof (error as { status: unknown }).status === "number",
    ),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
}));

function renderLogin() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <LoginForm />
    </NextIntlClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    login.mockReset();
    replace.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits credentials through AuthProvider.login", async () => {
    login.mockResolvedValue({ email: "pm@bonyan.com" });
    const ui = userEvent.setup();
    const view = renderLogin();
    const form = within(view.container);

    await ui.type(form.getByLabelText("Email"), "pm@bonyan.com");
    await ui.type(form.getByLabelText("Password"), "password123");
    await ui.click(form.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "pm@bonyan.com",
        password: "password123",
        rememberMe: true,
      });
    });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("shows invalid credentials on 401", async () => {
    login.mockRejectedValue({ status: 401, message: "Unauthorized" });
    const ui = userEvent.setup();
    const view = renderLogin();
    const form = within(view.container);

    await ui.type(form.getByLabelText("Email"), "pm@bonyan.com");
    await ui.type(form.getByLabelText("Password"), "password123");
    await ui.click(form.getByRole("button", { name: "Sign in" }));

    expect(
      await form.findByText("Invalid email or password."),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
