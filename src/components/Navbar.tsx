import React from 'react'
import { Link } from 'react-router-dom'
import { Car, PlusCircle, History, LogOut, Settings } from 'lucide-react'

interface NavbarProps {
  onLogout: () => void
}

function Navbar({ onLogout }: NavbarProps) {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold">ParkingSystem</span>
          </Link>
          <div className="flex space-x-4">
            <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-100">
              <Car className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link to="/add" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-100">
              <PlusCircle className="h-5 w-5" />
              <span>Add Vehicle</span>
            </Link>
            <Link to="/history" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-100">
              <History className="h-5 w-5" />
              <span>History</span>
            </Link>
            <Link to="/settings" className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-100">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <button onClick={onLogout} className="flex items-center space-x-1 px-3 py-2 rounded-md hover:bg-gray-100 text-red-600">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
