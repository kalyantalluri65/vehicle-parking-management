import React, { useEffect, useState, useRef } from 'react'
import { format, differenceInMinutes } from 'date-fns'
import { Printer } from 'lucide-react'

interface Vehicle {
  _id: string
  name: string
  phoneNumber: string
  vehicleNumber: string
  brand: string
  category: string
  slotNumber: number
  entryTime: string
  exitTime?: string
  parkingFare?: number
}

interface ParkingSlot {
  _id: string
  slotNumber: number
  isOccupied: boolean
}

function Dashboard() {
  const [activeVehicles, setActiveVehicles] = useState<Vehicle[]>([])
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [parkingFare, setParkingFare] = useState<string>('')
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [calculatedFare, setCalculatedFare] = useState<number>(0)
  const [checkoutVehicle, setCheckoutVehicle] = useState<Vehicle | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyVehicles, setHistoryVehicles] = useState<Vehicle[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const receiptRef = useRef<HTMLDivElement>(null)

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentHistoryItems = historyVehicles.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(historyVehicles.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  useEffect(() => {
    fetchData()
    // Set up auto-refresh every 2 minutes
    const refreshInterval = setInterval(() => {
      fetchData()
    }, 120000) // 120000 ms = 2 minutes

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval)
  }, [])

  const isWithinCancellationPeriod = (entryTime: string) => {
    const entryDate = new Date(entryTime)
    const now = new Date()
    const minutesElapsed = differenceInMinutes(now, entryDate)
    return minutesElapsed <= 2 // 2 minutes cancellation window
  }

  const fetchData = async () => {
    try {
      const [vehiclesRes, slotsRes, historyRes] = await Promise.all([
        fetch('http://localhost:3000/api/vehicles?status=active'),
        fetch('http://localhost:3000/api/slots'),
        fetch('http://localhost:3000/api/vehicles?status=history'),
      ])
      const vehicles = await vehiclesRes.json()
      const slots = await slotsRes.json()
      const history = await historyRes.json()
      setActiveVehicles(vehicles)
      setSlots(slots)
      setHistoryVehicles(history)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleCheckoutClick = async (id: string) => {
    try {
      const vehicle = activeVehicles.find((v) => v._id === id)
      if (vehicle) {
        setCheckoutVehicle(vehicle)
      }

      const response = await fetch(`http://localhost:3000/api/vehicles/${id}/fare`)
      const { fare } = await response.json()
      setCalculatedFare(fare)
      setParkingFare(fare.toString())
      setCheckoutId(id)
    } catch (error) {
      console.error('Failed to calculate fare:', error)
    }
  }

  const handleCheckout = async () => {
    if (!checkoutId) return

    try {
      const response = await fetch(`http://localhost:3000/api/vehicles/${checkoutId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        setTimeout(() => {
          setCheckoutId(null)
          setParkingFare('')
          setCalculatedFare(0)
          setCheckoutVehicle(null)
          fetchData()
        }, 500)
      }
    } catch (error) {
      console.error('Failed to checkout vehicle:', error)
    }
  }

  const cancelSlot = async (vehicleId: string) => {
    try {
      const vehicle = activeVehicles.find((v) => v._id === vehicleId)
      if (!vehicle) return

      const response = await fetch(`http://localhost:3000/api/vehicles/${vehicleId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        fetchData()
      } else {
        console.error('Failed to cancel slot')
      }
    } catch (error) {
      console.error('Error cancelling slot:', error)
    }
  }

  const printReceipt = () => {
    if (receiptRef.current) {
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
        printWindow.document.write(receiptRef.current.innerHTML)
        printWindow.document.write('</body></html>')
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      }
    }
  }

  const printSlotToken = (vehicle: Vehicle) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write('<html><head><title>Parking Token</title>')
      printWindow.document.write('<style>')
      printWindow.document.write(`
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .token { max-width: 300px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; }
        .token-header { text-align: center; margin-bottom: 20px; }
        .token-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .token-subtitle { font-size: 14px; color: #666; }
        .token-body { margin-bottom: 20px; }
        .token-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .token-label { font-weight: bold; }
        .token-slot { font-size: 24px; font-weight: bold; text-align: center; margin: 15px 0; padding: 10px; border: 2px dashed #000; }
        .token-footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      `)
      printWindow.document.write('</style></head><body>')
      printWindow.document.write(`
        <div class="token">
          <div class="token-header">
            <div class="token-title">PARKING TOKEN</div>
            <div class="token-subtitle">ParkingSystem</div>
          </div>
          <div class="token-body">
            <div class="token-slot">SLOT ${vehicle.slotNumber}</div>
            <div class="token-row">
              <span class="token-label">Vehicle:</span>
              <span>${vehicle.brand} (${vehicle.category})</span>
            </div>
            <div class="token-row">
              <span class="token-label">Number:</span>
              <span>${vehicle.vehicleNumber}</span>
            </div>
            <div class="token-row">
              <span class="token-label">Name:</span>
              <span>${vehicle.name}</span>
            </div>
            <div class="token-row">
              <span class="token-label">Entry Time:</span>
              <span>${format(new Date(vehicle.entryTime), 'PPp')}</span>
            </div>
          </div>
          <div class="token-footer">
            Please keep this token safe. You will need it when checking out.
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Parking Management</h2>
        <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          {showHistory ? 'Show Active Vehicles' : 'Show History'}
        </button>
      </div>

      {!showHistory ? (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-4">Parking Slots Status</h2>
            <div className="overflow-auto max-h-[400px] pb-4">
              <div className="grid grid-cols-10 gap-2">
                {slots.map((slot) => (
                  <div key={slot._id} className={`p-2 rounded-lg text-center ${slot.isOccupied ? 'bg-red-100' : 'bg-green-100'}`}>
                    <div className="font-bold text-sm">Slot {slot.slotNumber}</div>
                    <div className="text-xs">{slot.isOccupied ? 'Occupied' : 'Available'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {checkoutId && checkoutVehicle && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="text-lg font-semibold mb-4">Parking Fare</h3>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Total parking fare:</p>
                  <p className="text-3xl font-bold text-blue-600">₹{calculatedFare}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Vehicle type: {checkoutVehicle.category}</p>
                    <p>Rate: {checkoutVehicle.category === 'motorcycle' ? '₹0.2/minute' : checkoutVehicle.category === 'truck' ? '₹0.7/minute' : '₹0.5/minute'}</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={printReceipt} className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCheckoutId(null)
                        setParkingFare('')
                        setCalculatedFare(0)
                        setCheckoutVehicle(null)
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button onClick={handleCheckout} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                      Confirm Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold mb-4">Currently Parked Vehicles</h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeVehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td className="px-6 py-4 whitespace-nowrap">{vehicle.slotNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{vehicle.name}</div>
                        <div className="text-sm text-gray-500">{vehicle.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{vehicle.vehicleNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{vehicle.brand}</div>
                        <div className="text-sm text-gray-500">{vehicle.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(vehicle.entryTime), 'PPp')}</td>
                      <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
                        <button onClick={() => printSlotToken(vehicle)} className="flex items-center bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
                          <Printer className="h-4 w-4 mr-1" />
                          Token
                        </button>
                        <button onClick={() => handleCheckoutClick(vehicle._id)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                          Checkout
                        </button>
                        <button
                          onClick={() => cancelSlot(vehicle._id)}
                          disabled={!isWithinCancellationPeriod(vehicle.entryTime)}
                          className={`px-3 py-1 rounded ${isWithinCancellationPeriod(vehicle.entryTime) ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                        >
                          Cancel Slot
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeVehicles.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No vehicles currently parked
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Vehicle History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Currently Parked Vehicles Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-600">Currently Parked Vehicles</h3>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entry Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentHistoryItems
                        .filter((vehicle) => !vehicle.exitTime)
                        .map((vehicle) => (
                          <tr key={vehicle._id}>
                            <td className="px-4 py-2">
                              <div className="font-medium">{vehicle.vehicleNumber}</div>
                              <div className="text-sm text-gray-500">
                                {vehicle.brand} ({vehicle.category})
                              </div>
                            </td>
                            <td className="px-4 py-2">{vehicle.slotNumber}</td>
                            <td className="px-4 py-2">{format(new Date(vehicle.entryTime), 'PPp')}</td>
                          </tr>
                        ))}
                      {currentHistoryItems.filter((vehicle) => !vehicle.exitTime).length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                            No vehicles currently parked
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outgoing Vehicles Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-red-600">Outgoing Vehicles</h3>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exit Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fare</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentHistoryItems
                        .filter((vehicle) => vehicle.exitTime)
                        .map((vehicle) => (
                          <tr key={vehicle._id}>
                            <td className="px-4 py-2">
                              <div className="font-medium">{vehicle.vehicleNumber}</div>
                              <div className="text-sm text-gray-500">
                                {vehicle.brand} ({vehicle.category})
                              </div>
                            </td>
                            <td className="px-4 py-2">{format(new Date(vehicle.exitTime!), 'PPp')}</td>
                            <td className="px-4 py-2">₹{vehicle.parkingFare}</td>
                          </tr>
                        ))}
                      {currentHistoryItems.filter((vehicle) => vehicle.exitTime).length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                            No outgoing vehicles in history
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
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
      )}
    </div>
  )
}

export default Dashboard
