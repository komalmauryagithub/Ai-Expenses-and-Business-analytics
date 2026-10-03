import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { 
  Tag, Plus, Edit2, Trash2, Shield, Loader2, AlertCircle, CheckCircle2, 
  ArrowLeft, Search, Filter, Lock, Layers 
} from 'lucide-react';

const CategoriesPage = () => {
  const { user, logout, isAdmin } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' or 'income'
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Edit Modal
  const [editingCategory, setEditingCategory] = useState(null);

  // Delete Confirmation Modal
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/categories?type=${activeTab}`);
      setCategories(res.data.data.categories || []);
      setApiError('');
    } catch (err) {
      console.error('Fetch categories error:', err);
      setApiError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeTab]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!name.trim()) {
      setModalError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/categories', { name, type });
      setSuccessMsg(`Category "${name}" created successfully.`);
      setShowCreateModal(false);
      setName('');
      fetchCategories();
    } catch (err) {
      console.error('Create category error:', err);
      if (err.response && err.response.data) {
        setModalError(err.response.data.message || 'Failed to create category.');
      } else {
        setModalError('Network error.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!name.trim()) {
      setModalError('Category name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.patch(`/categories/${editingCategory.id}`, { name, type: editingCategory.type });
      setSuccessMsg(`Category updated successfully.`);
      setEditingCategory(null);
      setName('');
      fetchCategories();
    } catch (err) {
      console.error('Edit category error:', err);
      if (err.response && err.response.data) {
        setModalError(err.response.data.message || 'Failed to update category.');
      } else {
        setModalError('Network error.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await api.delete(`/categories/${deletingCategory.id}`);
      setSuccessMsg(`Category "${deletingCategory.name}" deleted successfully.`);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Delete category error:', err);
      if (err.response && err.response.data) {
        setDeleteError(err.response.data.message || 'Failed to delete category.');
      } else {
        setDeleteError('Network error.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/dashboard" className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl text-white shadow-md">
              <Layers className="w-5 h-5" />
            </Link>
            <h1 className="font-bold text-white text-lg">Category Management</h1>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link to="/expenses" className="text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-medium">Expenses</Link>
            <Link to="/income" className="text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-medium">Income</Link>
            <Link to="/profile" className="text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-medium">Profile</Link>
            <button onClick={logout} className="text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 font-medium">Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-xs text-emerald-400 font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Controls & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex space-x-2">
            <button
              onClick={() => { setActiveTab('expense'); setType('expense'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => { setActiveTab('income'); setType('income'); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Income Categories
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48 sm:w-64"
              />
            </div>

            <button
              onClick={() => { setName(''); setModalError(''); setShowCreateModal(true); }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center shadow transition"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Category
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-3" />
            <p className="text-sm font-medium">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Tag className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-white">No Categories Found</p>
            <p className="text-xs mt-1">Create your first custom category using the Add Category button.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between hover:border-slate-700 transition shadow-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl border ${
                    cat.type === 'expense' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{cat.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      {cat.is_system ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <Lock className="w-2.5 h-2.5 mr-1" /> System Category
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          Custom Category
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!cat.is_system && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => { setEditingCategory(cat); setName(cat.name); setModalError(''); }}
                      className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setDeletingCategory(cat); setDeleteError(''); }}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Add Custom Category</h2>
              
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Subscriptions, Gym, Hobbies"
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Category Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="expense">Expense Category</option>
                    <option value="income">Income Category</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Save Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Edit Custom Category</h2>
              
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Update Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingCategory && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-xl font-bold text-white">Delete Category</h2>
              <p className="text-xs text-slate-300">
                Are you sure you want to delete <span className="font-bold text-white">"{deletingCategory.name}"</span>?
              </p>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>{deleteError}</div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default CategoriesPage;
