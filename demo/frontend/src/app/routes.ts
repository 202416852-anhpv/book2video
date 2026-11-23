import { createBrowserRouter } from "react-router";
import ProjectListPage from "./pages/ProjectListPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ProjectListPage,
  },
  {
    path: "/project/:id",
    Component: ProjectDetailPage,
  },
]);
