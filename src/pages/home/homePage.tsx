import { HomeBarber } from "@/components/home/homeBarber";
import { HomeClient } from "@/components/home/homeClient";
import { useGetUser } from "@/hooks/queries/user/useGetUser";

export const HomePage = () => {
  const { data: userData } = useGetUser();
  return (
    <section className="container mx-auto px-4 pt-16">
      <div className="flex justify-center">
        {userData?.role === "client" && <HomeClient />}
        {userData?.role === "barber" && <HomeBarber user={userData} />}
      </div>
    </section>
  );
};
