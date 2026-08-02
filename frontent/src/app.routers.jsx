import {createBrowserRouter} from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import { InterviewProvider } from "./features/Interview/interview.context";

// Layout wrapper for routes that need InterviewProvider
const InterviewLayout = ({ children }) => {
  return <InterviewProvider>{children}</InterviewProvider>;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/",
    element: (
      <InterviewLayout>
        <Protected>
          <Home />
        </Protected>
      </InterviewLayout>
    )
  },
  {
    path: "/interview/:interviewId",
    element: (
      <InterviewLayout>
        <Protected>
          <Interview />
        </Protected>
      </InterviewLayout>
    )
  }
]);    