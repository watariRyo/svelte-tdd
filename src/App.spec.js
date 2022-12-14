/**
 * @jest-environment jsdom
*/
import { render, screen } from "@testing-library/svelte"
import userEvent from "@testing-library/user-event"
import App from "./App.svelte"
import { setupServer } from "msw/node"
import { rest }  from "msw"
import { resetAuthState } from "./store/stores"
import storage from "./store/storage"

const server = setupServer(
    rest.post("/api/1.0/users/token/:token", async(req, res, ctx) => {
        return res(ctx.status(200))
    }),
    rest.get("/api/1.0/users", async(req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ 
            content:[
                {
                    id:1,
                    username:"user-in-list",
                    email:"user-in-list@mail.com",
                    image:null
                },
            ], 
            page:0, 
            size:0, 
            totalPages:0}
        ))
    }),
    rest.get("/api/1.0/users/:id", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({
            id: 1,
            username: "user1",
            email: "user1@mail.com",
            image: null
        }))
    }),
    rest.post("/api/1.0/auth", (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ id:5, username: "user5"}))
    })
);

beforeAll(() => server.listen());

beforeEach(() => {server.resetHandlers();})

afterAll(() => server.close());

describe("Routing", () => {

    const setup = (path) => {
        window.history.pushState({}, "", path)
        render(App);        
    }

    it.each`
        path | pageTestId
        ${"/"} | ${"home-page"}
        ${"/signup"} | ${"signup-page"}
        ${"/login"} | ${"login-page"}
        ${"/user/1"} | ${"user-page"}
        ${"/user/2"} | ${"user-page"}
        ${"/activate/123"} | ${"activation-page"}
        ${"/activate/456"} | ${"activation-page"}
    `("displays $pageTestId when path is $path", ({ path, pageTestId}) => {
        setup(path)
        const page = screen.queryByTestId(pageTestId);
        expect(page).toBeInTheDocument();
    });

    it.each`
        path | pageTestId
        ${"/"} | ${"signup-page"}
        ${"/"} | ${"login-page"}
        ${"/"} | ${"user-page"}
        ${"/"} | ${"activation-page"}
        ${"/signup"} | ${"home-page"}
        ${"/signup"} | ${"login-page"}
        ${"/signup"} | ${"user-page"}
        ${"/signup"} | ${"activation-page"}
        ${"/login"} | ${"home-page"}
        ${"/login"} | ${"signup-page"}
        ${"/login"} | ${"user-page"}
        ${"/login"} | ${"activation-page"}
        ${"/user/1"} | ${"home-page"}
        ${"/user/1"} | ${"signup-page"}
        ${"/user/1"} | ${"login-page"}
        ${"/user/1"} | ${"activation-page"}
        ${"/activate/123"} | ${"home-page"}
        ${"/activate/123"} | ${"signup-page"}
        ${"/activate/123"} | ${"login-page"}
        ${"/activate/123"} | ${"user-page"}
    `("does not displays $pageTestId when path is $path", ({ path, pageTestId}) => {
        setup(path)
        const page = screen.queryByTestId(pageTestId);
        expect(page).not.toBeInTheDocument();
    });
    it.each`
    path | queryName
    ${"/"} | ${"Home"}
    ${"/signup"} | ${"Sign Up"}
    `("has link to $queryName on NavBar", ({path, queryName}) => {
        setup(path)
        const link = screen.queryByRole("link", { name: queryName })
        expect(link).toBeInTheDocument();
        expect(link.getAttribute("href")).toBe(path)
    })

    it.each`
    initialPath | clicking | visible | lastUrl
    ${"/"} | ${"Sign Up"} | ${"signup-page"} | ${"/signup"} 
    ${"/signup"} | ${"Home"} | ${"home-page"} | ${"/"}
    ${"/"} | ${"Login"} | ${"login-page"} | ${"/login"}
    `("displays $visible page after clicking $clicking link", async({initialPath, clicking, visible, lastUrl}) => {
        setup(initialPath)
        const link = screen.queryByRole("link", { name: clicking})
        await userEvent.click(link)
        const page = screen.queryByTestId(visible)
        expect(page).toBeInTheDocument();
        expect(window.location.pathname).toBe(lastUrl)
    })
    it("displays home page when clicking brand logo", async() => {
        setup("login")
        const image = screen.queryByTestId("Hoaxify")
        await userEvent.click(image)
        expect(screen.queryByTestId("home-page")).toBeInTheDocument()
    })
    it("navigates to user page when clicking the username on user list", async() => {
        setup("/");
        const user = await screen.findByText("user-in-list");
        await userEvent.click(user);
        expect(screen.queryByTestId("user-page")).toBeInTheDocument()
    })
    describe("Login", () => {

        let emailInput, passwordInput, button;

        const setupFillLogin = async() => {
            setup("/login")
            emailInput = screen.queryByLabelText("E-mail")
            passwordInput = screen.queryByLabelText("Password")
            button = screen.queryByRole("button", { name: "Login"})
            await userEvent.type(emailInput, "user5@mail.com")
            await userEvent.type(passwordInput, "P4ssword")
        }

        afterEach(() => {
            storage.clear();
            resetAuthState()
        })

        xit("redirects to homepage after successfull login", async() => {
            await setupFillLogin()
            await userEvent.click(button);
            const homepage = await screen.findByText("home-page")
            // screen.debug()???????????????????????????????????????
            expect(homepage).toBeInTheDocument();
        })
        xit("hides login and sign up from navbar after successfull login", async() => {
            await setupFillLogin()
            const loginLink = screen.queryByRole("link", { name: "Login" })
            const signUpLink = screen.queryByRole("link", { name: "Sign Up" })
            await userEvent.click(button);
            await screen.findByText("home-page")
            expect(loginLink).not.toBeInTheDocument();
            expect(signUpLink).not.toBeInTheDocument();
        })
        it("displays My Profile link on navbar after successful login", async() => {
            await setupFillLogin();
            await userEvent.click(button)
            await screen.findByTestId("home-page")
            const myProfileLink = screen.queryByRole("link", { name: "My Profile" })
            expect(myProfileLink).toBeInTheDocument()
        })
        it("displays User Page with logged in user id in url after clicking", async() => {
            await setupFillLogin();
            await userEvent.click(button)
            await screen.findByTestId("home-page")
            const myProfileLink = screen.queryByRole("link", { name: "My Profile" })
            await userEvent.click(myProfileLink)
            expect(screen.queryByTestId("user-page")).toBeInTheDocument()
            expect(window.location.pathname.endsWith("/user/5")).toBeTruthy();
        })
        it("stores logged in state in local storage", async() => {
            await setupFillLogin();
            await userEvent.click(button);
            await screen.findByTestId("home-page")
            const state = storage.getItem("auth")
            expect(state.isLoggedIn).toBeTruthy();
        })
        it("displays layout og logged in state when local storage has in user", async() => {
            storage.setItem("auth", { isLoggedIn: true})
            resetAuthState()
            await setup("/")
            const myProfileLink = screen.queryByRole("link", { name: "My Profile" })
            expect(myProfileLink).toBeInTheDocument()
        })
    })
})