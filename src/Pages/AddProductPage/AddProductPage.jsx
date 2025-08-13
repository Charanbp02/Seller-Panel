import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiPlus, FiTrash2, FiX, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const initialProductState = {
  name: '',
  salePrice: '',
  mrp: '',
  taxType: 'incl',
  tax: '',
  categories: '',
  description: '',
  quantity: '0',
  measuringUnit: 'Pieces',
  youtubeUrl: '',
  productId: '',
  paymentMode: 'Default',
  size: '',
  color: '',
  fabric: '',
  showOnline: true,
  additionalFields: [],
  images: []
};

const AddProductPage = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [newProduct, setNewProduct] = useState(initialProductState);
  const [additionalField, setAdditionalField] = useState({ name: '', value: '' });
  const [errors, setErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dragId, setDragId] = useState(null);

  const measuringUnits = ['Pieces', 'Kg', 'G', 'Lb', 'Oz', 'Units', 'Pairs', 'Sets'];
  const paymentModes = ['Default', 'COD', 'Online', 'Card', 'Cash'];
  const categorySuggestions = ['Men', 'Women', 'Accessories', 'Shoes', 'Bags'];

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!newProduct.name.trim()) newErrors.name = 'Product name is required';
    if (!newProduct.salePrice || newProduct.salePrice < 0) newErrors.salePrice = 'Sale price must be a positive number';
    if (newProduct.mrp && newProduct.mrp < 0) newErrors.mrp = 'MRP must be a positive number';
    if (newProduct.tax && newProduct.tax < 0) newErrors.tax = 'Tax must be a positive number';
    if (newProduct.quantity < 0) newErrors.quantity = 'Quantity must be a positive number';
    if (newProduct.youtubeUrl && !/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(newProduct.youtubeUrl)) {
      newErrors.youtubeUrl = 'Invalid YouTube URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    validateForm();
  }, [newProduct]);

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the errors in the form' });
      return;
    }
    setPreviewOpen(true);
  };

  const handleConfirmSubmit = () => {
    console.log('Product submitted:', newProduct);
    setNotification({ type: 'success', message: 'Product added successfully!' });
    setTimeout(() => {
      navigate('/products');
    }, 1500);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (newProduct.images.length + files.length > 6) {
      setNotification({ type: 'error', message: 'Maximum 6 images allowed' });
      return;
    }
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setNewProduct({ ...newProduct, images: [...newProduct.images, ...imageUrls] });
    setNotification({ type: 'success', message: 'Images uploaded successfully' });
  };

  const handleRemoveImage = (index) => {
    setNewProduct({
      ...newProduct,
      images: newProduct.images.filter((_, i) => i !== index),
    });
    setNotification({ type: 'success', message: 'Image removed' });
  };

  const handleAddAdditionalField = () => {
    if (!additionalField.name.trim() || !additionalField.value.trim()) {
      setNotification({ type: 'error', message: 'Additional field name and value are required' });
      return;
    }
    setNewProduct({
      ...newProduct,
      additionalFields: [...newProduct.additionalFields, { ...additionalField }]
    });
    setAdditionalField({ name: '', value: '' });
    setNotification({ type: 'success', message: 'Additional field added' });
  };

  const handleEditAdditionalField = (index, key, value) => {
    const updatedFields = newProduct.additionalFields.map((field, i) =>
      i === index ? { ...field, [key]: value } : field
    );
    setNewProduct({ ...newProduct, additionalFields: updatedFields });
  };

  const handleGenerateDescription = () => {
    setNewProduct({
      ...newProduct,
      description: 'This is a generated product description based on the product details. Customize as needed.'
    });
    setNotification({ type: 'success', message: 'Description generated' });
  };

  const handleClearForm = () => {
    setNewProduct(initialProductState);
    setAdditionalField({ name: '', value: '' });
    setNotification({ type: 'success', message: 'Form cleared' });
  };

  // Drag-and-drop handlers
  const handleDragStart = (e, index) => {
    setDragId(index);
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;

    const newImages = [...newProduct.images];
    const [draggedImage] = newImages.splice(dragIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    setNewProduct({ ...newProduct, images: newImages });
    setNotification({ type: 'success', message: 'Images reordered' });
  };

  return (
    <div className={`min-h-screen py-1 px-1 sm:py-6 sm:px-6 lg:py-8 lg:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm sm:text-base ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} mb-4 transition-colors`}
        >
          <FiArrowLeft size={20} /> Back to Products
        </button>
        
        <div className={`rounded-xl shadow-md border p-4 sm:p-6 ${isDarkMode ? 'bg-gray-800 text-gray-200 border-gray-700' : 'bg-white text-gray-800 border-gray-100'}`}>
          <h2 className="text-lg sm:text-xl font-semibold mb-6">Add Product</h2>

          {notification && (
            <div className={`mb-4 p-3 rounded-md text-sm ${notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              {notification.message}
            </div>
          )}

          <form onSubmit={handleAddProduct} className="space-y-4">
            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium mb-1">Product Image</label>
              <div className={`border rounded-md p-4 text-center ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm ${isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                  <FiPlus /> Add Image
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Maximum 6 Images. Drag thumbnail to re-order</p>
              </div>
              {newProduct.images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {newProduct.images.map((image, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`relative border-2 rounded ${dragId === index ? 'border-blue-500' : isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}
                    >
                      <img src={image} alt={`Image ${index + 1}`} className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className={`absolute top-0 right-0 rounded-full p-1 ${isDarkMode ? 'bg-gray-700 text-red-400' : 'bg-white text-red-500'}`}
                      >
                        <FiX size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                required
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'} ${errors.name ? 'border-red-500' : ''}`}
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Sale Price */}
            <div>
              <label className="block text-sm font-medium mb-1">Sale Price</label>
              <div className="relative">
                <span className={`absolute left-3 top-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>₹</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className={`w-full pl-6 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'} ${errors.salePrice ? 'border-red-500' : ''}`}
                  value={newProduct.salePrice}
                  onChange={(e) => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                />
              </div>
              {errors.salePrice && <p className="text-xs text-red-500 mt-1">{errors.salePrice}</p>}
            </div>

            {/* MRP */}
            <div>
              <label className="block text-sm font-medium mb-1">MRP <span className="text-gray-500">(Optional)</span></label>
              <div className="relative">
                <span className={`absolute left-3 top-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`w-full pl-6 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'} ${errors.mrp ? 'border-red-500' : ''}`}
                  value={newProduct.mrp}
                  onChange={(e) => setNewProduct({ ...newProduct, mrp: e.target.value })}
                />
              </div>
              {errors.mrp && <p className="text-xs text-red-500 mt-1">{errors.mrp}</p>}
            </div>

            {/* Tax Type */}
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-2 rounded-md text-sm ${newProduct.taxType === 'incl' ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setNewProduct({ ...newProduct, taxType: 'incl' })}
              >
                Tax Incl.
              </button>
              <button
                type="button"
                className={`flex-1 py-2 rounded-md text-sm ${newProduct.taxType === 'excl' ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setNewProduct({ ...newProduct, taxType: 'excl' })}
              >
                Tax Excl.
              </button>
            </div>

            {/* Tax */}
            <div>
              <label className="block text-sm font-medium mb-1">Tax <span className="text-gray-500">(Optional)</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'} ${errors.tax ? 'border-red-500' : ''}`}
                value={newProduct.tax}
                onChange={(e) => setNewProduct({ ...newProduct, tax: e.target.value })}
              />
              {errors.tax && <p className="text-xs text-red-500 mt-1">{errors.tax}</p>}
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium mb-1">Categories</label>
              <input
                type="text"
                placeholder="e.g. Men's Wear, Shirts"
                list="category-suggestions"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                value={newProduct.categories}
                onChange={(e) => setNewProduct({ ...newProduct, categories: e.target.value })}
              />
              <datalist id="category-suggestions">
                {categorySuggestions.map(category => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Description</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} hover:underline`}
                >
                  Generate
                </button>
              </div>
              <textarea
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                rows="4"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>

            {/* Quantity and Measuring Units */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'} ${errors.quantity ? 'border-red-500' : ''}`}
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                />
                {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Measuring Units</label>
                <select
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                  value={newProduct.measuringUnit}
                  onChange={(e) => setNewProduct({ ...newProduct, measuringUnit: e.target.value })}
                >
                  {measuringUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Youtube URL */}
            <div>
              <label className="block text-sm font-medium mb-1">Youtube URL <span className="text-gray-500">(Optional)</span></label>
              <input
                type="url"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'} ${errors.youtubeUrl ? 'border-red-500' : ''}`}
                value={newProduct.youtubeUrl}
                onChange={(e) => setNewProduct({ ...newProduct, youtubeUrl: e.target.value })}
              />
              {errors.youtubeUrl && <p className="text-xs text-red-500 mt-1">{errors.youtubeUrl}</p>}
            </div>

            {/* Product ID */}
            <div>
              <label className="block text-sm font-medium mb-1">Product ID</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                value={newProduct.productId}
                onChange={(e) => setNewProduct({ ...newProduct, productId: e.target.value })}
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium mb-1">Payment Mode</label>
              <select
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                value={newProduct.paymentMode}
                onChange={(e) => setNewProduct({ ...newProduct, paymentMode: e.target.value })}
              >
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            {/* Variant Fields */}
            <div>
              <label className="block text-sm font-medium mb-2">Variant Fields</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Size</label>
                  <input
                    type="text"
                    placeholder="e.g. S, M, L, XL"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    value={newProduct.size}
                    onChange={(e) => setNewProduct({ ...newProduct, size: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Red, Blue"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    value={newProduct.color}
                    onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Fabric</label>
                  <input
                    type="text"
                    placeholder="e.g. Cotton, Lycra"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    value={newProduct.fabric}
                    onChange={(e) => setNewProduct({ ...newProduct, fabric: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Additional Fields and Show Online */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddAdditionalField}
                  className={`flex items-center gap-1 text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} hover:underline`}
                >
                  <FiPlus size={16} /> Additional Fields
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Show Online</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.showOnline}
                    onChange={(e) => setNewProduct({ ...newProduct, showOnline: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:transition-all ${isDarkMode ? 'bg-gray-600 after:bg-gray-200 peer-checked:bg-blue-500 peer-checked:after:border-gray-200' : 'bg-gray-200 after:bg-white after:border-gray-300 after:border peer-checked:bg-blue-600 peer-checked:after:border-white'} peer-checked:after:translate-x-full after:rounded-full`}></div>
                </label>
              </div>
            </div>

            {newProduct.additionalFields.length > 0 && (
              <div className="space-y-2">
                {newProduct.additionalFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleEditAdditionalField(index, 'name', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleEditAdditionalField(index, 'value', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setNewProduct({
                        ...newProduct,
                        additionalFields: newProduct.additionalFields.filter((_, i) => i !== index)
                      })}
                      className="text-red-500"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Additional Field Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Field Name"
                className={`px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                value={additionalField.name}
                onChange={(e) => setAdditionalField({ ...additionalField, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Field Value"
                className={`px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
                value={additionalField.value}
                onChange={(e) => setAdditionalField({ ...additionalField, value: e.target.value })}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClearForm}
                className={`px-6 py-2 border rounded-md text-sm ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className={`px-6 py-2 border rounded-md text-sm ${isDarkMode ? 'border-blue-500 text-blue-400 hover:bg-blue-900' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Object.keys(errors).length > 0}
                className={`px-6 py-2 rounded-md text-sm ${Object.keys(errors).length > 0 ? 'bg-gray-400 cursor-not-allowed' : isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                Preview
              </button>
            </div>
          </form>
        </div>

        {/* Preview Modal */}
        {previewOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Product Preview</h2>
                <button onClick={() => setPreviewOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
                  <FiX size={20} />
                </button>
              </div>
              {newProduct.images.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Images</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {newProduct.images.map((image, index) => (
                      <img key={index} src={image} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}
              <p><strong>Name:</strong> {newProduct.name}</p>
              <p><strong>Sale Price:</strong> ₹{newProduct.salePrice}</p>
              {newProduct.mrp && <p><strong>MRP:</strong> ₹{newProduct.mrp}</p>}
              <p><strong>Tax Type:</strong> {newProduct.taxType === 'incl' ? 'Inclusive' : 'Exclusive'}</p>
              {newProduct.tax && <p><strong>Tax:</strong> {newProduct.tax}%</p>}
              <p><strong>Categories:</strong> {newProduct.categories || 'None'}</p>
              <p><strong>Description:</strong> {newProduct.description || 'None'}</p>
              <p><strong>Quantity:</strong> {newProduct.quantity} {newProduct.measuringUnit}</p>
              {newProduct.youtubeUrl && <p><strong>YouTube URL:</strong> <a href={newProduct.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{newProduct.youtubeUrl}</a></p>}
              <p><strong>Product ID:</strong> {newProduct.productId || 'None'}</p>
              <p><strong>Payment Mode:</strong> {newProduct.paymentMode}</p>
              {newProduct.size && <p><strong>Size:</strong> {newProduct.size}</p>}
              {newProduct.color && <p><strong>Color:</strong> {newProduct.color}</p>}
              {newProduct.fabric && <p><strong>Fabric:</strong> {newProduct.fabric}</p>}
              <p><strong>Show Online:</strong> {newProduct.showOnline ? 'Yes' : 'No'}</p>
              {newProduct.additionalFields.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Additional Fields</h3>
                  {newProduct.additionalFields.map((field, index) => (
                    <p key={index}><strong>{field.name}:</strong> {field.value}</p>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setPreviewOpen(false)}
                  className={`px-6 py-2 border rounded-md text-sm ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className={`px-6 py-2 rounded-md text-sm ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProductPage;
