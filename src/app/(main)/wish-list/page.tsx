import React from "react";
import WishList from "@/app/components/wish-list/wish-list";

const WishListPage = () => {
  return (
    <div className="max-w-screen-lg mx-auto p-5">
      <h1 className="text-2xl font-bold mb-5">欲しい教科書リスト</h1>
      <WishList />
    </div>
  );
};

export default WishListPage;
