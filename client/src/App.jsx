import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import Layout from "./layout";
import Meeting from "./pages/Meeting/Meeting";
import LiveMeeting from "./pages/LiveMeeting/LiveMeeting";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "../ProtectedRoute";
import NoPage from "./pages/NoPage/NoPage";
import GenerateNotes from "./pages/GenerateNotes/GenerateNotes";
import MeetingHistory from "./pages/MeetingHistory/MeetingHistory";
import JoinMeeting from "./pages/JoinMeeting/JoinMeeting";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="/meeting"
            element={
              <ProtectedRoute>
                <Meeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live-meeting"
            element={
              <ProtectedRoute>
                <LiveMeeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/join-meeting/:id"
            element={
              <ProtectedRoute>
                <JoinMeeting/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audio-notes"
            element={
              <ProtectedRoute>
                <GenerateNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meeting-history/:id"
            element={
              <ProtectedRoute>
                <MeetingHistory />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NoPage/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
