/**
 * @jest-environment jsdom
*/
import { render, screen } from "@testing-library/svelte"
import userEvent from "@testing-library/user-event"
import App from "./App.svelte"
import { setupServer } from "msw/node"
import { rest }  from "msw"

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
        xit("redirects to homepage after successfull login", async() => {
            server.use(
                rest.post("/api/1.0/auth", (req, res, ctx) => {
                    return res(ctx.status(200), ctx.json({ username: "user5"}))
                })
            )
            setup("/login")
            const emailInput = screen.queryByLabelText("E-mail")
            const passwordInput = screen.queryByLabelText("Password")
            const button = screen.queryByRole("button", { name: "Login"})
            await userEvent.type(emailInput, "user5@mail.com")
            await userEvent.type(passwordInput, "P4ssword")
            await userEvent.click(button);  
            const homepage = screen.findByTestId("home-page")
            expect(homepage).toBeInTheDocument();
        })
    })
})