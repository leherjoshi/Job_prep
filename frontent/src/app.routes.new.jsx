import {createBrowserRouter, Outlet} from "react-router";
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/protected";
import Home from "./features/Interview/pages/Home";
import Interview from "./features/Interview/pages/Interview";
import StartMockInterview from "./features/Interview/pages/StartMockInterview";
import MockInterview from "./features/Interview/pages/MockInterview";
import MockInterviewSummary from "./features/Interview/pages/MockInterviewSummary";
import { InterviewProvider } from "./features/Interview/interview.context";

// Layout component that provides Interview context
function InterviewLayout() {
  return (
    <InterviewProvider>
      <Outlet />
    </InterviewProvider>
  );
}

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
    element: <InterviewLayout />,
    children: [
      {
        path: "/",
        element: (
          <Protected>
            <Home />
          </Protected>
        )
      },
      {
        path: "/interview/:interviewId",
        element: (
          <Protected>
            <Interview />
          </Protected>
        )
      },
      {
        path: "/mock-interview/start/:reportId",
        element: (
          <Protected>
            <StartMockInterview />
          </Protected>
        )
      },
      {
        path: "/mock-interview/:sessionId",
        element: (
          <Protected>
            <MockInterview />
          </Protected>
        )
      },
      {
        path: "/mock-interview/:sessionId/summary",
        element: (
          <Protected>
            <MockInterviewSummary />
          </Protected>
        )
      }
    ]
  }
]);
