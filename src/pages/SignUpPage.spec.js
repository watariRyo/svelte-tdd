/**
 * @jest-environment jsdom
*/
import SignUpPage from './SignUpPage.svelte'
import LanguageSelector from "../components/LanguageSelector.svelte"
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { setupServer } from "msw/node"
import { rest }  from "msw"
import en from "../locale/en.json"
import ja from "../locale/ja.json"

const server = setupServer();

beforeAll(() => server.listen());

beforeEach(() => {server.resetHandlers();})

afterAll(() => server.close());

describe("Sign Up Page", () => {
    describe("Layout", () => {
        it('has Sign Up header', () => {
            render(SignUpPage);
            const header = screen.getByRole('heading', { name: "Sign Up" });
            expect(header).toBeInTheDocument();
        });
        it("has username input", () => {
            render(SignUpPage);
            const input = screen.getByLabelText("Username");
            expect(input).toBeInTheDocument();
        })
        it("has email input", () => {
            render(SignUpPage);
            const input = screen.getByLabelText("E-mail");
            expect(input).toBeInTheDocument();
        })
        it("has password input", () => {
            render(SignUpPage);
            const input = screen.getByLabelText("Password");
            expect(input).toBeInTheDocument();
        })
        it("has password type for password input", () => {
            render(SignUpPage);
            const input = screen.getByLabelText("Password");
            expect(input.type).toBe("password");
        })
        it("has password repeat input", () => {
            render(SignUpPage);
            const input = screen.getByLabelText("Password Repeat");
            expect(input.type).toBe("password");
        })
        it("has password type for password repeat input", () => {
            render(SignUpPage);
            const input = screen.getByLabelText("Password Repeat");
            expect(input.type).toBe("password");
        })
        it('has Sign Up header', () => {
            render(SignUpPage);
            const button = screen.getByRole('button', { name: "Sign Up" });
            expect(button).toBeInTheDocument();
        });
        it('the disables the button initially', () => {
            render(SignUpPage);
            const button = screen.getByRole('button', { name: "Sign Up" });
            expect(button).toBeDisabled();
        });
    });
    describe("Interactions", () => {

        let requestBody;
        let counter = 0;
        beforeEach(() => {
            counter = 0;
            server.use(
                rest.post("/api/1.0/users", async(req, res, ctx) => {
                    requestBody = await req.json();
                    counter += 1;
                    return res(ctx.status(200))
                })
            )
        })

        let button, usernaemInput, passwordInput, passwordRepeatInput;
        const setUp = async() => {
            render(SignUpPage);
            usernaemInput = screen.getByLabelText("Username");
            const emailInput = screen.getByLabelText("E-mail");
            passwordInput = screen.getByLabelText("Password");
            passwordRepeatInput = screen.getByLabelText("Password Repeat");

            button = screen.getByRole('button', { name: "Sign Up" });
            await userEvent.type(usernaemInput, "user1");
            await userEvent.type(emailInput, "user1@mail.com");
            await userEvent.type(passwordInput, "P4ssword");
            await userEvent.type(passwordRepeatInput, "P4ssword");
        }

        it("enable the button when the password and password repeat fields have same value", async() => {
            await setUp();
            expect(button).toBeEnabled();
        });
        it("send username, email and password to backend after clicking the button", async() => {
            await setUp();

            // const mockFn = jest.fn();
            // axios.post = mockFn;
            // window.fetch = mockFn;

            await userEvent.click(button);

            await screen.findByText("Please check your e-mail to activate your account");
            // const firstCall = mockFn.mock.calls[0]
            // const body = JSON.parse(firstCall[1].body);
            expect(requestBody).toEqual({
                username: 'user1',
                email: 'user1@mail.com',
                password: 'P4ssword'
            })
        })
        it("disables button when there is an ongoing api call", async() => {
            await setUp();
            // const mockFn = jest.fn();
            // axios.post = mockFn;
            // window.fetch = mockFn;

            await userEvent.click(button);
            await userEvent.click(button);

            await screen.findByText("Please check your e-mail to activate your account");
            // const firstCall = mockFn.mock.calls[0]
            // const body = JSON.parse(firstCall[1].body);
            expect(counter).toBe(1)
        })
        xit("displays spinner while the api request in progress", async() => {            
            await setUp();

            await userEvent.click(button);

            await screen.findByText("Please check your e-mail to activate your account");

            const spinner = screen.getByRole("status");

            expect(spinner).toBeInTheDocument();
        })
        it("does not display spinner when there is no api request", async() => {
            await setUp();
            const spinner = screen.queryByRole("status");            
            expect(spinner).not.toBeInTheDocument();
        })
        it("displays account activation information after successfull sign up request", async() => {            
            await setUp();

            await userEvent.click(button);

            const text = await screen.findByText("Please check your e-mail to activate your account");
            expect(text).toBeInTheDocument();
        })
        it("does not display account activation message before sign up request", async() => {
            await setUp();
            const text = await screen.queryByText("Please check your e-mail to activate your account");
            expect(text).not.toBeInTheDocument();
        })
        it("does not displays account activation information after failing sign up request", async() => {
            server.use(
                rest.post("/api/1.0/users", async(req, res, ctx) => {
                    return res(
                        ctx.status(400),
                        ctx.json({
                            validationErrors: {
                                username: ""
                            }
                        })
                    )
                })              
            )
            await setUp();

            await userEvent.click(button);

            const text = await screen.queryByText("Please check your e-mail to activate your account");
            expect(text).not.toBeInTheDocument();
        })
        it("hide sign up form after successfull sign up request", async() => {
            await setUp();

            const form = screen.getByTestId("form-sign-up")
            await userEvent.click(button);
            await waitFor(() => {
                expect(form).not.toBeInTheDocument();
            })
        })

        const generateValidationError = (field, message) => {
            return rest.post("/api/1.0/users", (req, res, ctx) => {
                return res(
                    ctx.status(400),
                    ctx.json({
                        validationErrors: {
                            [field] : message
                        }
                    })
                );
            })
        }

        it.each`
        field | message 
        ${"username"} | ${"Username cannot be null"}
        ${"email"} | ${"E-mail cannot be null"}
        ${"password"} | ${"Password cannot be null"}
        `("display $message for $field", async({field, message}) => {
            server.use(
                generateValidationError(field, message)
            );
            await setUp();

            await userEvent.click(button);

            const validationError = await screen.findByText(message);
            expect(validationError).toBeInTheDocument();
        })
        it("hide spinner after response received", async() => {
            server.use(
                generateValidationError("username", "Username can not be null")
            );
            await setUp();

            await userEvent.click(button);

            await screen.findByText("Username can not be null");
            const spinner = screen.queryByRole("status")
            expect(spinner).not.toBeInTheDocument();
        })
        it("enables the button after response received", async() => {
            server.use(
                generateValidationError("username", "Username can not be null")
            );
            await setUp();

            await userEvent.click(button);

            await screen.findByText("Username can not be null");
            expect(button).toBeEnabled();
        })
        it("displays mismatch message for password repeat input", async() => {
            await setUp();
            await userEvent.type(passwordInput, "P4ssword");
            await userEvent.type(passwordRepeatInput, "P4ssw0rd");
            const validationError = await screen.findByText("Password mismatch")
            expect(validationError).toBeInTheDocument();
        })
        it("does not display mismatch message initially", async() => {
            render(SignUpPage)
            const validationError = await screen.queryByText("Password mismatch")
            expect(validationError).not.toBeInTheDocument();
        })
        it.each`
        field | message | label
        ${"username"} | ${"Username cannot be null"} | ${"Username"}
        ${"email"} | ${"E-mail cannot be null"} | ${"E-mail"}
        ${"password"} | ${"Password cannot be null"}  | ${"Password"}
        `("clears validation error after $field field is updated", async({field, message, label}) => {
            server.use(
                generateValidationError(field, message)
            );
            await setUp();

            await userEvent.click(button);

            const validationError = await screen.findByText(message);
            const input = screen.getByLabelText(label)
            await userEvent.type(input, "updated")
            expect(validationError).not.toBeInTheDocument();
        })
    })
    describe("Internatinalization", () => {
        beforeEach(() => {
            server.use(
                rest.post("/api/1.0/users", async(req, res, ctx) => {
                    const language = req.headers.get("Accept-Language") || "en";
                    return res(ctx.status(400),
                        ctx.json({
                            validationErrors: {
                                "username": language === "en" ? "Username cannot be null" : "ユーザ名が空白です"
                            }
                        })
                    )
                })
            )
        })

        let japaneseToggle, englishToggle, password, passwordRepeat, button;
        const setup = () => {
            render(SignUpPage)
            render(LanguageSelector)
            japaneseToggle = screen.getByTitle("Japanese")
            englishToggle = screen.getByTitle("English")
            password = screen.queryByLabelText(en.password)
            passwordRepeat = screen.queryByLabelText(en.passwordRepeat)
            button = screen.getByRole("button", { name: en.signUp})
        }
        afterEach(() => {
            document.body.innerHTML = "";
        })
        it("initially displays all texts in English", () => {
            setup()
            expect(screen.queryByRole("heading", { name: en.signUp})).toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: en.signUp })
            ).toBeInTheDocument();
            expect(screen.queryByLabelText(en.username)).toBeInTheDocument();
            expect(screen.queryByLabelText(en.email)).toBeInTheDocument();
            expect(screen.queryByLabelText(en.password)).toBeInTheDocument();
            expect(screen.queryByLabelText(en.passwordRepeat)).toBeInTheDocument();
        })
        it("displays all texts in Japanese after toggling the language", async() => {
            setup()
            await userEvent.click(japaneseToggle);
            expect(screen.queryByRole("heading", { name: ja.signUp})).toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: ja.signUp })
            ).toBeInTheDocument();
            expect(screen.queryByLabelText(ja.username)).toBeInTheDocument();
            expect(screen.queryByLabelText(ja.email)).toBeInTheDocument();
            expect(screen.queryByLabelText(ja.password)).toBeInTheDocument();
            expect(screen.queryByLabelText(ja.passwordRepeat)).toBeInTheDocument();
        })
        it("displays all texts in English after toggling back from japanese", async() => {
            setup()
            await userEvent.click(japaneseToggle);
            await userEvent.click(englishToggle);
            expect(screen.queryByRole("heading", { name: en.signUp})).toBeInTheDocument();
            expect(
                screen.queryByRole("button", { name: en.signUp })
            ).toBeInTheDocument();
            expect(screen.queryByLabelText(en.username)).toBeInTheDocument();
            expect(screen.queryByLabelText(en.email)).toBeInTheDocument();
            expect(screen.queryByLabelText(en.password)).toBeInTheDocument();
            expect(screen.queryByLabelText(en.passwordRepeat)).toBeInTheDocument();
        })
        it("displays password missmatch validatoin in Japanese", async() => {
            setup();
            await userEvent.click(japaneseToggle);
            password = screen.queryByLabelText(ja.password)
            await userEvent.type(password, "P@assw0rd")
            const validationMessageInJapanese = screen.queryByText(ja.passwordMismatchValidation)
            expect(validationMessageInJapanese).toBeInTheDocument();
        })
        it("returns validation messages in english initially", async() => {
            setup();
            await userEvent.type(password, "P@ssw0rd")
            await userEvent.type(passwordRepeat, "P@ssw0rd")
            await userEvent.click(button);
            const validationError = await screen.findByText("Username cannot be null")
            expect(validationError).toBeInTheDocument()
        })
        it("returns validation messages in japanese after language is selected", async() => {
            setup();
            await userEvent.click(japaneseToggle);
            await userEvent.type(password, "P@ssw0rd")
            await userEvent.type(passwordRepeat, "P@ssw0rd")
            await userEvent.click(button);
            const validationError = await screen.findByText("ユーザ名が空白です")
            expect(validationError).toBeInTheDocument()
        })
        it("returns validation messages in english after toggling back from japanese", async() => {
            setup();
            await userEvent.click(japaneseToggle);
            await userEvent.click(englishToggle);
            await userEvent.type(password, "P@ssw0rd")
            await userEvent.type(passwordRepeat, "P@ssw0rd")
            await userEvent.click(button);
            const validationError = await screen.findByText("Username cannot be null")
            expect(validationError).toBeInTheDocument()
        })
    })
})