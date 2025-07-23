import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Search, Printer } from 'lucide-react'

interface Vehicle {
  _id: string
  name: string
  phoneNumber: string
  vehicleNumber: string
  brand: string
  category: string
  slotNumber: number
  entryTime: string
  exitTime: string
  parkingFare: number
}

function History() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [searchDate, setSearchDate] = useState<string>('')
  const [searchSlot, setSearchSlot] = useState<string>('')
  const [searchVehicle, setSearchVehicle] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [vehicleNumberError, setVehicleNumberError] = useState<string>('')

  // Regular expression for vehicle number validation
  // Format: AA11AA1111 or AA11A1111 (where A is a letter and 1 is a digit)
  const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentVehicles = vehicles.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(vehicles.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleVehicleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setSearchVehicle(value)

    if (value && !vehicleNumberRegex.test(value)) {
      setVehicleNumberError('Invalid format. Use format: AA11AA1111 or AA11A1111')
    } else {
      setVehicleNumberError('')
    }
  }

  useEffect(() => {
    fetchHistory()
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchDate, searchSlot, searchVehicle])

  const fetchHistory = async () => {
    try {
      let url = 'http://localhost:3000/api/vehicles?status=history'

      if (searchDate) {
        url += `&date=${searchDate}`
      }
      if (searchSlot) {
        url += `&slotNumber=${searchSlot}`
      }
      if (searchVehicle) {
        url += `&vehicleNumber=${searchVehicle}`
      }

      const response = await fetch(url)
      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const calculateDuration = (entryTime: string, exitTime: string) => {
    const start = new Date(entryTime)
    const end = new Date(exitTime)
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const clearFilters = () => {
    setSearchDate('')
    setSearchSlot('')
    setSearchVehicle('')
    setVehicleNumberError('')
  }

  const printReceipt = (vehicle: Vehicle) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write('<html><head><title>Parking Receipt</title>')
      printWindow.document.write('<style>')
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .receipt { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; }
        .receipt-header { text-align: center; margin-bottom: 20px; }
        .receipt-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .receipt-subtitle { font-size: 14px; color: #666; }
        .receipt-body { margin-bottom: 20px; }
        .receipt-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .receipt-label { font-weight: bold; }
        .receipt-footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .receipt-total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; }
      `)
      printWindow.document.write('</style></head><body>')
      printWindow.document.write(`
        <div class="receipt">
          <div class="receipt-header">
            <div class="receipt-title">PARKING RECEIPT</div>
            <div class="receipt-subtitle">ParkingSystem</div>
          </div>
          <div class="receipt-body">
            <div class="receipt-row">
              <span class="receipt-label">Vehicle:</span>
              <span>${vehicle.brand} (${vehicle.category})</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Number:</span>
              <span>${vehicle.vehicleNumber}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Name:</span>
              <span>${vehicle.name}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Slot:</span>
              <span>${vehicle.slotNumber}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Entry Time:</span>
              <span>${format(new Date(vehicle.entryTime), 'PPp')}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Exit Time:</span>
              <span>${format(new Date(vehicle.exitTime), 'PPp')}</span>
            </div>
            <div class="receipt-row">
              <span class="receipt-label">Duration:</span>
              <span>${calculateDuration(vehicle.entryTime, vehicle.exitTime)}</span>
            </div>
            <div class="receipt-total">
              Total Amount: ₹${vehicle.parkingFare}
            </div>
          </div>
          <div class="receipt-footer">
            Thank you for using our parking service!
          </div>
        </div>
      `)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Parking History</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              value={searchVehicle}
              onChange={handleVehicleNumberChange}
              placeholder="Search vehicle number"
              className={`pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${vehicleNumberError ? 'border-red-500' : ''}`}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            {vehicleNumberError && <div className="absolute -bottom-6 left-0 text-xs text-red-500">{vehicleNumberError}</div>}
          </div>
          <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={searchSlot} onChange={(e) => setSearchSlot(e.target.value)} className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Slots</option>
            {Array.from({ length: 50 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Slot {i + 1}
              </option>
            ))}
          </select>
          {(searchDate || searchSlot || searchVehicle) && (
            <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-800">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fare</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentVehicles.map((vehicle) => (
              <tr key={vehicle._id}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{vehicle.name}</div>
                  <div className="text-sm text-gray-500">
                    {vehicle.brand} ({vehicle.category})
                  </div>
                  <div className="text-sm text-gray-500">{vehicle.phoneNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{vehicle.vehicleNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{vehicle.slotNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap">{format(new Date(vehicle.entryTime), 'PPp')}</td>
                <td className="px-6 py-4 whitespace-nowrap">{format(new Date(vehicle.exitTime), 'PPp')}</td>
                <td className="px-6 py-4 whitespace-nowrap">{calculateDuration(vehicle.entryTime, vehicle.exitTime)}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">₹{vehicle.parkingFare}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => printReceipt(vehicle)} className="flex items-center bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
                    <Printer className="h-4 w-4 mr-1" />
                    Receipt
                  </button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 py-4 bg-gray-50">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default History
