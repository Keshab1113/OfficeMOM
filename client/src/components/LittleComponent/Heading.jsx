const Heading = ({heading, subHeading}) => {
  return (
    <div className=" md:h-[17vh] h-[30vh] flex flex-col justify-center items-center">
      <h1 className="text-[28px] md:text-[35px] font-bold text-gray-800 dark:text-white text-center">
        {heading}
      </h1>
        <p className="text-base md:text-base font-bold text-gray-500 dark:text-white text-center">
          {subHeading}
        </p>
    </div>
  );
};

export default Heading;
