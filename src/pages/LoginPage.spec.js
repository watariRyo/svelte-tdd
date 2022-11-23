/**
 * @jest-environment jsdom
*/
import { render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event"
import LoginPage from "./LoginPage.svelte"
import LanguageSelector from "../components/LanguageSelector.svelte"
import { setupServer } from "msw/node"
import { rest }  from "msw"
import en from "../locale/en.json"
import ja from "../locale/ja.json"

const server = setupServer();

beforeAll(() => server.listen());

beforeEach(() => {server.resetHandlers();})

afterAll(() => server.close());

describe("Login Page", () => {
    describe("Layout", () => {
        it("has Login header", () => {
            render(LoginPage)
            expect(screen.getByRole("heading", { name: "Login"})
            ).toBeInTheDocument()
        })
        it("has email input", () => {
            render(LoginPage);
            const input = screen.getByLabelText("E-mail");
            expect(input).toBeInTheDocument();
        })
        it("has password input", () => {
            render(LoginPage);
            const input = screen.getByLabelText("Password");
            expect(input).toBeInTheDocument();
        })
        it("has password type for password input", () => {
            render(LoginPage);
            const input = screen.getByLabelText("Password");
            expect(input.type).toBe("password");
        })
        it('has Sign Up header', () => {
            render(LoginPage);
            const button = screen.getByRole('button', { name: "Login" });
            expect(button).toBeInTheDocument();
        });
        it('the disables the button initially', () => {
            render(LoginPage);
            const button = screen.getByRole('button', { name: "Login" });
            expect(button).toBeDisabled();
        });
    })
    describe("Interactions", () => {

        let emailInput, passwordInput, button

        const setup = async() => {
            render(LoginPage);
            emailInput = screen.getByLabelText("E-mail")
            passwordInput = screen.getByLabelText("Password")
            await userEvent.type(emailInput, "user100@mail.com")
            await userEvent.type(passwordInput, "P4ssword")
            button = screen.getByRole("button", { name: "Login" })
        }

        let requestBody
        let counter = 0;
        beforeEach(() => {
            counter = 0;
            server.use(
                rest.post("/api/1.0/auth", async(req, res, ctx) => {
                    requestBody = await req.json();
                    counter += 1;
                    return res(ctx.status(401), ctx.json({ message: "Incorrect credentials"}));
                })
            )
        })

        it("enables the button when email and password inputs are filled", async() => {
            await setup()
            expect(button).not.toBeDisabled();
        })
        xit("displays spinner after clicking the button", async() => {
            await setup();
            await userEvent.click(button)
            const spinner = screen.getByRole("status")
            expect(spinner).toBeInTheDocument()
        })
        xit("hides spinner after api call finishes", async() => {
            // 恐らく、request bodyをawait している都合spinnerの消滅まで待機してしまうためテストが成功しない
            await setup();
            await userEvent.click(button)
            const spinner = screen.getByRole("status")
            await waitFor(() => {
                expect(spinner).not.toBeInTheDocument()
            })
        })
        it("sends email and password values to backend after clicking the button", async() => {
            await setup()
            await userEvent.click(button);
            // const spinner = screen.getByRole("status")
            // await waitForElementToBeRemoved(spinner);
            expect(requestBody).toEqual({
                email: "user100@mail.com",
                password: "P4ssword"
            })
        })
        xit("disables the button when there is an api call", async() => {
            await setup()
            await userEvent.click(button)
            await userEvent.click(button)
            expect(counter).toBe(1)
        })
        xit("displays authentication fail message", async () => {
            await setup();
            await userEvent.click(button);
            const errorMessage =  screen.findByText("Incorrect credentials");
            expect(errorMessage).toBeInTheDocument()
        })
        xit("clears authentication fail message when email field is change", async() => {
            await setup();
            await userEvent.click(button);
            const errorMessage =  screen.findByText("Incorrect credentials");
            await userEvent.type(emailInput, "hoge")
            expect(errorMessage).not.toBeInTheDocument();
        })
        xit("clears authentication fail message when email field is change", async() => {
            await setup();
            await userEvent.click(button);
            const errorMessage =  screen.findByText("Incorrect credentials");
            await userEvent.type(passwordInput, "hoge")
            expect(errorMessage).not.toBeInTheDocument();
        })
        xit("stores id, username, and image in ls", async() => {
            server.use(
                rest.post("/api/1.0/auth", async(req, res, ctx) => {
                    requestBody = await req.json();
                    counter += 1;
                    return res(ctx.status(200), ctx.json({ id: 5, username: "user5", image: null, token: "asdfg"}));
                })
            );
            await setup();
            await userEvent.click(button)
            // const spinner = screen.queryByRole("status")
            // await waitForElementToBeRemoved(spinner)
            const storedState = storage.getItem("auth")
            expect(storedState.header).toBe("Bearer asdfg")
        })
    })
    describe("Internatinalization", () => {
        beforeEach(() => {
            server.use(
                rest.post("/api/1.0/auth", (req, res, ctx) => {
                    const language = req.headers.get("Accept-Language") || "en";
                    return res(ctx.status(400),
                        ctx.json({
                            validationErrors: {
                                "username": language === "en" ? "Incorrect credentials" : "認証に失敗しました"
                            }
                        })
                    )
                })
            )
        })

        let japaneseToggle;
        const setup = () => {
            render(LoginPage)
            render(LanguageSelector)
            japaneseToggle = screen.getByTitle("Japanese")
        }
        afterEach(() => {
            document.body.innerHTML = "";
        })

        it("initially displays all texts in english", () => {
            setup();
            expect(screen.queryByRole("heading", {name: en.login})).toBeInTheDocument();
            expect(screen.queryByRole("button", {name: en.login})).toBeInTheDocument();
            expect(screen.queryByLabelText(en.email)).toBeInTheDocument();
            expect(screen.queryByLabelText(en.password)).toBeInTheDocument();
        })
        it("initially displays all texts in japanese after changing laungage", async() => {
            setup();
            await userEvent.click(japaneseToggle)
            expect(screen.queryByRole("heading", {name: ja.login})).toBeInTheDocument();
            expect(screen.queryByRole("button", {name: ja.login})).toBeInTheDocument();
            expect(screen.queryByLabelText(ja.email)).toBeInTheDocument();
            expect(screen.queryByLabelText(ja.password)).toBeInTheDocument();
        })
        xit("returns authentication fail message in japanese", async () => {
            setup();
            await userEvent.click(japaneseToggle)
            const emailInput = screen.queryByLabelText(ja.email)
            const passwordInput = screen.queryByLabelText(ja.password)
            const button = screen.queryByRole("button", { name: ja.login})
            await userEvent.type(emailInput, "user100@mail.com")
            await userEvent.type(passwordInput, "P4ssword")
            await userEvent.click(button);            
            const errorMessage = screen.findByText("認証に失敗しました")
            expect(errorMessage).toBeInTheDocument();
        })
    })
})
