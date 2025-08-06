import { Outlet } from 'react-router-dom'
import Footer from './components/Footer/Footer'
import SideBar from './components/SideBar/SideBar'

function Layout() {

    return (
        <section className=' max-w-screen overflow-x-hidden'>
            <div className="flex overflow-x-hidden min-h-screen gap-0">
                <SideBar />
                <div className="flex-1 bg-black">
                    <Outlet />
                </div>
            </div>
            <Footer />
        </section>

    )
}

export default Layout