import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { format } from 'date-fns'

function AddVehicle() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    vehicleNumber: '',
    brand: '',
    category: 'car',
  })
  const [newVehicle, setNewVehicle] = useState<any>(null)
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState('')
  const [vehicleNumberError, setVehicleNumberError] = useState('')

  // Regular expression for vehicle number validation
  // Format: AA11AA1111 or AA11A1111 (where A is a letter and 1 is a digit)
  const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate vehicle number before submission
    if (!vehicleNumberRegex.test(formData.vehicleNumber)) {
      setVehicleNumberError('Invalid vehicle number format. Use format: AA11AA1111 or AA11A1111')
      return
    }

    try {
      const response = await fetch('https://vehicle-parking-management.onrender.com/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setNewVehicle(data)
        setShowToken(true)
      } else {
        if (data.error === 'No parking slots available') {
          setError('Sorry, our parking lot is currently full. Please try another parking facility nearby.')
        } else {
          setError(data.error || 'Failed to register vehicle')
        }
      }
    } catch (error) {
      console.error('Failed to add vehicle:', error)
      setError('Failed to register vehicle. Please try again.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Special handling for vehicle number
    if (name === 'vehicleNumber') {
      const upperValue = value.toUpperCase()
      setFormData({
        ...formData,
        [name]: upperValue,
      })

      // Validate vehicle number format
      if (upperValue && !vehicleNumberRegex.test(upperValue)) {
        setVehicleNumberError('Invalid format. Use format: AA11AA1111 or AA11A1111')
      } else {
        setVehicleNumberError('')
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleCancelSlot = async () => {
    if (!newVehicle?._id) return

    try {
      const response = await fetch(`https://vehicle-parking-management.onrender.com/api/vehicles/${newVehicle._id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        navigate('/')
      } else {
        setError('Failed to cancel slot. Please try again.')
      }
    } catch (error) {
      console.error('Failed to cancel slot:', error)
      setError('Failed to cancel slot. Please try again.')
    }
  }

  const printSlotToken = () => {
    if (!newVehicle) return

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
            <div class="token-slot">SLOT ${newVehicle.slotNumber}</div>
            <div class="token-row">
              <span class="token-label">Vehicle:</span>
              <span>${newVehicle.brand} (${newVehicle.category})</span>
            </div>
            <div class="token-row">
              <span class="token-label">Number:</span>
              <span>${newVehicle.vehicleNumber}</span>
            </div>
            <div class="token-row">
              <span class="token-label">Name:</span>
              <span>${newVehicle.name}</span>
            </div>
            <div class="token-row">
              <span class="token-label">Entry Time:</span>
              <span>${format(new Date(newVehicle.entryTime), 'PPp')}</span>
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Register New Vehicle</h2>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
          <p className="text-lg font-medium">{error}</p>
          {error.includes('full') && <p className="mt-2 text-sm">We apologize for the inconvenience. Please check nearby parking facilities or wait for a spot to become available.</p>}
        </div>
      )}

      {showToken && newVehicle ? (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">Vehicle Registered Successfully!</div>
            <div className="text-4xl font-bold mb-4">SLOT {newVehicle.slotNumber}</div>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Name:</div>
                <div className="font-medium">{newVehicle.name}</div>

                <div className="text-gray-600">Vehicle Number:</div>
                <div className="font-medium">{newVehicle.vehicleNumber}</div>

                <div className="text-gray-600">Vehicle:</div>
                <div className="font-medium">
                  {newVehicle.brand} ({newVehicle.category})
                </div>

                <div className="text-gray-600">Entry Time:</div>
                <div className="font-medium">{format(new Date(newVehicle.entryTime), 'PPp')}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex space-x-2">
              <button onClick={printSlotToken} className="flex items-center bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
                <Printer className="h-5 w-5 mr-2" />
                Print Token
              </button>
              <button onClick={handleCancelSlot} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Cancel Slot
              </button>
            </div>

            <button onClick={() => navigate('/')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
              Phone Number
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="phoneNumber"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="vehicleNumber">
              Vehicle Number
            </label>
            <input
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline uppercase ${
                vehicleNumberError ? 'border-red-500' : ''
              }`}
              id="vehicleNumber"
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              placeholder="e.g., KA01AB1234"
              required
            />
            {vehicleNumberError && <div className="text-red-500 text-sm mt-1">{vehicleNumberError}</div>}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brand">
              Vehicle Brand
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="brand"
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
              Vehicle Category
            </label>
            <select
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="truck">Truck</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Register Vehicle
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AddVehicle
