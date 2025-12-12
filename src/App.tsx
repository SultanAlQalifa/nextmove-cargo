import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ScrollToTop from "./components/ScrollToTop";
import SnowEffect from "./components/common/SnowEffect";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const BecomeForwarder = lazy(() => import("./pages/BecomeForwarder"));
const ClientDashboard = lazy(() => import("./pages/dashboard/ClientDashboard"));
const ForwarderDashboard = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderDashboard"),
);
const AdminDashboard = lazy(
  () => import("./pages/dashboard/admin/AdminDashboard"),
);
const CalculatorPage = lazy(() => import("./pages/CalculatorPage"));
const SupplierQuoteRequest = lazy(() => import("./pages/SupplierQuoteRequest"));
const DriverDashboard = lazy(() => import("./pages/dashboard/DriverDashboard"));
const DriverSettings = lazy(
  () => import("./pages/dashboard/driver/DriverSettings"),
);
const DriverSupport = lazy(
  () => import("./pages/dashboard/driver/DriverSupport"),
);
const DriverMessages = lazy(
  () => import("./pages/dashboard/driver/DriverMessages"),
);
const DriverPayments = lazy(
  () => import("./pages/dashboard/driver/DriverPayments"),
);
const DriverPOD = lazy(() => import("./pages/dashboard/driver/DriverPOD"));
const DashboardRedirect = lazy(() => import("./pages/DashboardRedirect"));
const DebugAuth = lazy(() => import("./pages/DebugAuth"));
const NotificationsPage = lazy(
  () => import("./pages/dashboard/NotificationsPage"),
);
const ClientRFQList = lazy(() => import("./components/rfq/ClientRFQList"));
const CreateRFQForm = lazy(() => import("./components/rfq/CreateRFQForm"));
const RFQDetail = lazy(() => import("./pages/dashboard/client/RFQDetail"));
const AvailableRFQs = lazy(
  () => import("./pages/dashboard/forwarder/AvailableRFQs"),
);
const CreateOfferForm = lazy(() => import("./components/rfq/CreateOfferForm"));
const ClientShipments = lazy(
  () => import("./pages/dashboard/client/ClientShipments"),
);
const ClientShipmentDetail = lazy(
  () => import("./pages/dashboard/client/ClientShipmentDetail"),
);
const ClientPayments = lazy(
  () => import("./pages/dashboard/client/ClientPayments"),
);
const ClientWallet = lazy(
  () => import("./pages/dashboard/client/ClientWallet"),
);
const ClientMessages = lazy(
  () => import("./pages/dashboard/client/ClientMessages"),
);
const ClientSupport = lazy(
  () => import("./pages/dashboard/client/ClientSupport"),
);
const ClientGroupage = lazy(
  () => import("./pages/dashboard/client/ClientGroupage"),
);
const ClientSettings = lazy(
  () => import("./pages/dashboard/client/ClientSettings"),
);
const UpgradeToPro = lazy(() => import("./pages/UpgradeToPro"));
const DocumentCenter = lazy(
  () => import("./pages/dashboard/documents/DocumentCenter"),
);
const TrackingPage = lazy(() => import("./pages/TrackingPage")); // Public Tracking

const ForwarderOffers = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderOffers"),
);
const ForwarderShipments = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderShipments"),
);
const ForwarderMessages = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderMessages"),
);
const ForwarderGroupage = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderGroupage"),
);
const ForwarderPOD = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderPOD"),
);
const ForwarderPersonnel = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderPersonnel"),
);
const ForwarderClients = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderClients"),
);
const ForwarderPayments = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderPayments"),
);
const ForwarderFundCalls = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderFundCalls"),
);
const ForwarderCoupons = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderCoupons"),
);
import ForwarderSubscription from "./pages/dashboard/forwarder/ForwarderSubscription";
const ForwarderSupport = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderSupport"),
);
const ForwarderAutomations = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderAutomations"),
);
const ForwarderSettings = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderSettings"),
);
const ForwarderKYC = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderKYC"),
);
const ForwarderRates = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderRates"),
);
const ShipmentDetail = lazy(
  () => import("./pages/dashboard/forwarder/ShipmentDetail"),
);
const ForwarderAddresses = lazy(
  () => import("./pages/dashboard/forwarder/ForwarderAddresses"),
);

const ReferralDashboard = lazy(
  () => import("./pages/dashboard/ReferralDashboard"),
);

const UserManagement = lazy(
  () => import("./pages/dashboard/admin/UserManagement"),
);
const AdminRFQList = lazy(() => import("./pages/dashboard/admin/AdminRFQList"));
const AdminShipments = lazy(
  () => import("./pages/dashboard/admin/AdminShipments"),
);
const AdminPayments = lazy(
  () => import("./pages/dashboard/admin/AdminPayments"),
);
const AdminSupport = lazy(() => import("./pages/dashboard/admin/AdminSupport"));
const AdminSubscriptions = lazy(
  () => import("./pages/dashboard/admin/AdminSubscriptions"),
);
const AdminForwarders = lazy(
  () => import("./pages/dashboard/admin/AdminForwarders"),
);
const AdminSettings = lazy(
  () => import("./pages/dashboard/admin/AdminSettings"),
);
const AdminBranding = lazy(
  () => import("./pages/dashboard/admin/AdminBranding"),
);
const AdminPaymentGateway = lazy(
  () => import("./pages/dashboard/admin/AdminPaymentGateway"),
);
const AdminFundCalls = lazy(
  () => import("./pages/dashboard/admin/AdminFundCalls"),
);
const AdminPOD = lazy(() => import("./pages/dashboard/admin/AdminPOD"));
const AdminPersonnel = lazy(
  () => import("./pages/dashboard/admin/AdminPersonnel"),
);
const AdminClients = lazy(() => import("./pages/dashboard/admin/AdminClients"));
const AdminFees = lazy(() => import("./pages/dashboard/admin/AdminFees"));
const AdminPlatformRates = lazy(
  () => import("./pages/dashboard/admin/AdminPlatformRates"),
);
const AdminFeatures = lazy(
  () => import("./pages/dashboard/admin/AdminFeatures"),
);
const AdminMessages = lazy(
  () => import("./pages/dashboard/admin/AdminMessages"),
);
const AdminCoupons = lazy(() => import("./pages/dashboard/admin/AdminCoupons"));
const AdminGroupage = lazy(
  () => import("./pages/dashboard/admin/AdminGroupage"),
);
const AdminLocations = lazy(
  () => import("./pages/dashboard/admin/AdminLocations"),
);
const AdminPackageTypes = lazy(
  () => import("./pages/dashboard/admin/AdminPackageTypes"),
);
const AdminEmails = lazy(() => import("./pages/dashboard/admin/AdminEmails"));
const AdminReferrals = lazy(
  () => import("./pages/dashboard/admin/AdminReferrals"),
);
const AdminSecurity = lazy(
  () => import("./pages/dashboard/admin/AdminSecurity"),
);

import "./i18n";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ChatProvider } from "./contexts/ChatContext";
import { BrandingProvider } from "./contexts/BrandingContext";
import { FeatureProvider } from "./contexts/FeatureContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UIProvider } from "./contexts/UIContext";
import { ToastProvider } from "./contexts/ToastContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import LoadingSpinner from "./components/common/LoadingSpinner";

function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <BrandingProvider>
            <FeatureProvider>
              <ToastProvider>
                <AuthProvider>
                  <ChatProvider>
                    <SnowEffect />
                    <Suspense fallback={<LoadingSpinner />}>
                      <NotificationProvider>
                        <UIProvider>
                          <Router
                            future={{
                              v7_startTransition: true,
                              v7_relativeSplatPath: true,
                            }}
                          >
                            <ScrollToTop />
                            <Suspense
                              fallback={
                                <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                                  <LoadingSpinner size="lg" />
                                </div>
                              }
                            >
                              <Routes>
                                {/* Public routes with main layout */}
                                <Route path="/" element={<Layout />}>
                                  <Route index element={<Home />} />
                                  <Route path="login" element={<Login />} />
                                  <Route path="register" element={<Register />} />
                                  <Route
                                    path="calculator"
                                    element={<CalculatorPage />}
                                  />
                                  <Route
                                    path="supplier-request"
                                    element={<SupplierQuoteRequest />}
                                  />
                                  <Route path="debug-auth" element={<DebugAuth />} />

                                  <Route
                                    path="reset-password"
                                    element={<ResetPassword />}
                                  />
                                  <Route path="about" element={<About />} />
                                  <Route path="contact" element={<Contact />} />
                                  <Route path="privacy" element={<Privacy />} />
                                  <Route
                                    path="become-forwarder"
                                    element={<BecomeForwarder />}
                                  />
                                  {/* Public Tracking Route */}
                                  <Route path="tracking" element={<TrackingPage />} />
                                  <Route
                                    path="tracking/:code"
                                    element={<TrackingPage />}
                                  />
                                </Route>

                                {/* Dashboard routes with sidebar layout */}
                                <Route element={<ProtectedRoute />}>
                                  <Route
                                    path="dashboard"
                                    element={<DashboardLayout />}
                                  >
                                    {/* Dashboard redirect */}
                                    <Route index element={<DashboardRedirect />} />
                                    <Route
                                      path="notifications"
                                      element={<NotificationsPage />}
                                    />

                                    {/* Client routes */}
                                    <Route
                                      element={
                                        <ProtectedRoute allowedRoles={["client"]} />
                                      }
                                    >
                                      <Route
                                        path="client"
                                        element={<ClientDashboard />}
                                      />
                                      <Route
                                        path="client/rfq"
                                        element={<ClientRFQList />}
                                      />
                                      <Route
                                        path="client/groupage"
                                        element={<ClientGroupage />}
                                      />
                                      <Route
                                        path="client/rfq/create"
                                        element={<CreateRFQForm />}
                                      />
                                      <Route
                                        path="client/rfq/:id"
                                        element={<RFQDetail />}
                                      />
                                      <Route
                                        path="client/shipments"
                                        element={<ClientShipments />}
                                      />
                                      <Route
                                        path="client/shipments/:id"
                                        element={<ClientShipmentDetail />}
                                      />
                                      <Route
                                        path="client/payments"
                                        element={<ClientPayments />}
                                      />
                                      <Route
                                        path="client/wallet"
                                        element={<ClientWallet />}
                                      />
                                      <Route
                                        path="client/messages"
                                        element={<ClientMessages />}
                                      />
                                      <Route
                                        path="client/support"
                                        element={<ClientSupport />}
                                      />
                                      <Route
                                        path="client/settings"
                                        element={<ClientSettings />}
                                      />
                                      <Route
                                        path="client/documents"
                                        element={<DocumentCenter />}
                                      />
                                      <Route
                                        path="client/referrals"
                                        element={<ReferralDashboard />}
                                      />
                                      <Route
                                        path="upgrade"
                                        element={<UpgradeToPro />}
                                      />
                                    </Route>

                                    {/* Forwarder routes */}
                                    <Route
                                      element={
                                        <ProtectedRoute
                                          allowedRoles={["forwarder"]}
                                        />
                                      }
                                    >
                                      <Route
                                        path="forwarder"
                                        element={<ForwarderDashboard />}
                                      />
                                      <Route
                                        path="forwarder/rfq"
                                        element={<AvailableRFQs />}
                                      />
                                      <Route
                                        path="forwarder/groupage"
                                        element={<ForwarderGroupage />}
                                      />
                                      <Route
                                        path="forwarder/rfq/available"
                                        element={<AvailableRFQs />}
                                      />
                                      <Route
                                        path="forwarder/rfq/:id/offer"
                                        element={<CreateOfferForm />}
                                      />
                                      <Route
                                        path="forwarder/offers"
                                        element={<ForwarderOffers />}
                                      />
                                      <Route
                                        path="forwarder/shipments"
                                        element={<ForwarderShipments />}
                                      />
                                      <Route
                                        path="forwarder/shipments/:id"
                                        element={<ShipmentDetail />}
                                      />
                                      <Route
                                        path="forwarder/documents"
                                        element={<DocumentCenter />}
                                      />
                                      <Route
                                        path="forwarder/messages"
                                        element={<ForwarderMessages />}
                                      />
                                      <Route
                                        path="forwarder/pod"
                                        element={<ForwarderPOD />}
                                      />
                                      <Route
                                        path="forwarder/personnel"
                                        element={<ForwarderPersonnel />}
                                      />
                                      <Route
                                        path="forwarder/rates"
                                        element={<ForwarderRates />}
                                      />
                                      <Route
                                        path="forwarder/clients"
                                        element={<ForwarderClients />}
                                      />
                                      <Route
                                        path="forwarder/wallet"
                                        element={<ClientWallet />}
                                      />
                                      <Route
                                        path="forwarder/payments"
                                        element={<ForwarderPayments />}
                                      />
                                      <Route
                                        path="forwarder/fund-calls"
                                        element={<ForwarderFundCalls />}
                                      />
                                      <Route
                                        path="forwarder/coupons"
                                        element={<ForwarderCoupons />}
                                      />
                                      <Route
                                        path="forwarder/subscription"
                                        element={<ForwarderSubscription />}
                                      />
                                      <Route
                                        path="forwarder/support"
                                        element={<ForwarderSupport />}
                                      />
                                      <Route
                                        path="forwarder/settings"
                                        element={<ForwarderSettings />}
                                      />
                                      <Route
                                        path="forwarder/kyc"
                                        element={<ForwarderKYC />}
                                      />
                                      <Route
                                        path="forwarder/referrals"
                                        element={<ReferralDashboard />}
                                      />
                                      <Route
                                        path="forwarder/automations"
                                        element={<ForwarderAutomations />}
                                      />
                                      <Route
                                        path="forwarder/addresses"
                                        element={<ForwarderAddresses />}
                                      />
                                    </Route>

                                    {/* Admin routes */}
                                    <Route
                                      element={
                                        <ProtectedRoute
                                          allowedRoles={["admin", "super-admin"]}
                                        />
                                      }
                                    >
                                      <Route
                                        path="admin"
                                        element={<AdminDashboard />}
                                      />
                                      <Route
                                        path="admin/users"
                                        element={<UserManagement />}
                                      />
                                      <Route
                                        path="admin/rfq"
                                        element={<AdminRFQList />}
                                      />
                                      <Route
                                        path="admin/groupage"
                                        element={<AdminGroupage />}
                                      />
                                      <Route
                                        path="admin/shipments"
                                        element={<AdminShipments />}
                                      />
                                      <Route
                                        path="admin/payments"
                                        element={<AdminPayments />}
                                      />
                                      <Route
                                        path="admin/coupons"
                                        element={<AdminCoupons />}
                                      />
                                      <Route
                                        path="admin/subscriptions"
                                        element={<AdminSubscriptions />}
                                      />
                                      <Route
                                        path="admin/settings"
                                        element={<AdminSettings />}
                                      />
                                      <Route
                                        path="admin/branding"
                                        element={<AdminBranding />}
                                      />
                                      <Route
                                        path="admin/payment-gateway"
                                        element={<AdminPaymentGateway />}
                                      />
                                      <Route
                                        path="admin/fund-calls"
                                        element={<AdminFundCalls />}
                                      />
                                      <Route
                                        path="admin/pod"
                                        element={<AdminPOD />}
                                      />
                                      <Route
                                        path="admin/personnel"
                                        element={<AdminPersonnel />}
                                      />
                                      <Route
                                        path="admin/forwarders"
                                        element={<AdminForwarders />}
                                      />
                                      <Route
                                        path="admin/clients"
                                        element={<AdminClients />}
                                      />
                                      <Route
                                        path="admin/fees"
                                        element={<AdminFees />}
                                      />
                                      <Route
                                        path="admin/features"
                                        element={<AdminFeatures />}
                                      />
                                      <Route
                                        path="admin/support"
                                        element={<AdminSupport />}
                                      />
                                      <Route
                                        path="admin/messages"
                                        element={<AdminMessages />}
                                      />
                                      <Route
                                        path="admin/locations"
                                        element={<AdminLocations />}
                                      />
                                      <Route
                                        path="admin/package-types"
                                        element={<AdminPackageTypes />}
                                      />
                                      <Route
                                        path="admin/platform-rates"
                                        element={<AdminPlatformRates />}
                                      />
                                      <Route
                                        path="admin/emails"
                                        element={<AdminEmails />}
                                      />
                                      <Route
                                        path="admin/referrals"
                                        element={<AdminReferrals />}
                                      />
                                      <Route
                                        path="admin/security"
                                        element={<AdminSecurity />}
                                      />
                                    </Route>

                                    {/* Driver routes */}
                                    <Route
                                      element={
                                        <ProtectedRoute allowedRoles={["driver"]} />
                                      }
                                    >
                                      <Route
                                        path="driver"
                                        element={<DriverDashboard />}
                                      />
                                      <Route
                                        path="driver/settings"
                                        element={<DriverSettings />}
                                      />
                                      <Route
                                        path="driver/support"
                                        element={<DriverSupport />}
                                      />
                                      <Route
                                        path="driver/messages"
                                        element={<DriverMessages />}
                                      />
                                      <Route
                                        path="driver/payments"
                                        element={<DriverPayments />}
                                      />
                                      <Route
                                        path="driver/pod"
                                        element={<DriverPOD />}
                                      />
                                    </Route>
                                  </Route>
                                </Route>
                              </Routes>
                            </Suspense>
                          </Router>
                        </UIProvider>
                      </NotificationProvider>
                    </Suspense>
                  </ChatProvider>
                </AuthProvider>
              </ToastProvider>
            </FeatureProvider>
          </BrandingProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

export default App;
