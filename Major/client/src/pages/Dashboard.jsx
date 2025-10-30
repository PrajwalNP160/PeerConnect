import React from "react";
import ActiveExchanges from "../components/ActiveExchanges";

const Dashboard = () => {

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Your Dashboard
        </h1>

        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <ActiveExchanges />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
