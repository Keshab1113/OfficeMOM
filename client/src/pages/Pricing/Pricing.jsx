import Footer from "../../components/Footer/Footer";
import { Helmet } from "react-helmet";
import PricingOptions from "../../components/PricingOptions/PricingOptions";

const Pricing = () => {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>OfficeMom | Pricing</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      <section className="relative flex h-full min-h-screen md:w-full w-screen items-center justify-center dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center dark:[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)] dark:bg-[linear-gradient(90deg,#06080D_0%,#0D121C_100%)] bg-[linear-gradient(180deg,white_0%,#d3e4f0_100%)]"></div>

        <div className="relative z-20 max-h-screen overflow-hidden overflow-y-scroll">
          <PricingOptions />
          <Footer />
        </div>
      </section>
    </>
  );
};
export default Pricing;
