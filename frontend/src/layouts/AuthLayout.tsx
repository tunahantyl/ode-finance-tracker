import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-canvas">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-ink text-white">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-white text-ink text-base font-bold flex items-center justify-center">
            Ö
          </div>
          <span className="font-semibold text-lg">Öde</span>
        </div>
        <div className="space-y-3 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Bütçenizi sade ve net bir şekilde takip edin.
          </h1>
          <p className="text-white/70">
            Gelir-gider girişlerinizi saniyeler içinde kaydedin, harcama
            alışkanlıklarınızı temiz grafiklerle anlayın.
          </p>
        </div>
        <p className="text-xs text-white/50">© Öde · Bütçe Takibi</p>
      </div>
      <div className="flex flex-col items-center justify-center p-5 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-ink text-white text-base font-bold flex items-center justify-center">
              Ö
            </div>
            <span className="font-semibold text-lg text-ink">Öde</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
