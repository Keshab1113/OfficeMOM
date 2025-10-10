import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Layout from "./layout";
import Meeting from "./pages/Meeting/Meeting";
import LiveMeeting from "./pages/LiveMeeting/LiveMeeting";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "../ProtectedRoute";
import NoPage from "./pages/NoPage/NoPage";
import GenerateNotes from "./pages/GenerateNotes/GenerateNotes";
import MeetingHistory from "./pages/MeetingHistory/MeetingHistory";
import JoinMeeting from "./pages/JoinMeeting/JoinMeeting";
import AboutUs from "./pages/AboutUs/AboutUs";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ContactPage from "./pages/ContactPage/ContactPage";
import Pricing from "./pages/Pricing/Pricing";
import DemoVideo from "./pages/DemoVideo/DemoVideo";
import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";
import Documentation from "./pages/Documentation/Documentation";
import Success from "./pages/PaymentResult/Success";
import Failure from "./pages/PaymentResult/Failure";
import OAuthSuccess from "./pages/OAuthSuccess";

function App() {
  return (
    <>
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
          <Route path="/join-meeting/:id" element={<JoinMeeting />} />
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
            path="/momGenerate/:id"
            element={
              <ProtectedRoute>
                <MeetingHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/contact-us" element={<ContactPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<DemoVideo />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route
            path="/success"
            element={
              <ProtectedRoute>
                <Success />
              </ProtectedRoute>
            }
          />
          <Route
            path="/failure"
            element={
              <ProtectedRoute>
                <Failure />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NoPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
