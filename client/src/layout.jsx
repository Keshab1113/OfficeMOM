import { Outlet } from 'react-router-dom'
import Footer from './components/Footer/Footer'
import SideBar from './components/SideBar/SideBar'
import DarkLight from './components/DarkLight/DarkLight'

function Layout() {

    return (
        <section className=' max-w-screen overflow-x-hidden'>
            <div className="flex overflow-x-hidden min-h-screen gap-0">
                <SideBar />
                <div className="flex-1 dark:bg-black bg-white relative">
                    <Outlet />
                    <DarkLight/>
                </div>
            </div>
        </section>

    )
}

export default Layout