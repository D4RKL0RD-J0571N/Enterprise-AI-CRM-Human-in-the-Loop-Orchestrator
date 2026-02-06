import { useTranslation } from "react-i18next";
import { Database, Plus, Edit2, Trash2, Upload } from "lucide-react";
import type { AIDataset } from "../../../types/admin";

interface Props {
    datasets: AIDataset[];
    selectedDataset: AIDataset | null;
    setSelectedDataset: (ds: AIDataset | null) => void;
    newDataset: { name: string, data_type: string, content: string };
    setNewDataset: (ds: { name: string, data_type: string, content: string }) => void;
    handleCreateDataset: () => void;
    handleUpdateDataset: () => void;
    handleDeleteDataset: (id: number) => void;
    toggleDatasetActive: (id: number) => void;
    handleFileUpload: (file: File, name: string, type: string) => Promise<void>;
}

export const DatasetsTab = ({
    datasets,
    selectedDataset,
    setSelectedDataset,
    newDataset,
    setNewDataset,
    handleCreateDataset,
    handleUpdateDataset,
    handleDeleteDataset,
    toggleDatasetActive,
    handleFileUpload
}: Props) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
            {/* List */}
            <div className="md:col-span-1 space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                <button
                    onClick={() => setSelectedDataset(null)}
                    className={`w-full p-6 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center gap-3 group ${!selectedDataset ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-gray-400'}`}
                >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="font-bold text-sm dark:text-gray-300">{t('admin.sections.new_dataset')}</span>
                </button>

                {datasets.map((ds) => (
                    <div
                        key={ds.id}
                        onClick={() => setSelectedDataset(ds)}
                        className={`w-full p-5 rounded-3xl border transition-all cursor-pointer group relative ${selectedDataset?.id === ds.id ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-xl scale-[1.02]' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-300'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${ds.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <Database className={`w-5 h-5 ${ds.is_active ? 'text-emerald-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm dark:text-gray-200 truncate">{ds.name}</h4>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-bold">{ds.data_type}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleDatasetActive(ds.id); }}
                                    className={`w-8 h-4 rounded-full transition-colors relative ${ds.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${ds.is_active ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor */}
            <div className="md:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-2xl flex flex-col">
                <div className="flex justify-between items-center border-b dark:border-gray-800 pb-6 mb-6">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-3">
                        <Edit2 className="w-6 h-6 text-blue-500" /> {selectedDataset ? t('admin.sections.edit_dataset') : t('admin.sections.new_dataset')}
                    </h2>
                    <div className="flex gap-2">
                        {!selectedDataset && (
                            <label className="flex items-center gap-2 p-3 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all cursor-pointer font-bold text-xs">
                                <Upload className="w-5 h-5" />
                                {t('admin.actions.upload_file')}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".csv,.json"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const type = file.name.endsWith('.csv') ? 'csv' : 'json';
                                            handleFileUpload(file, file.name.split('.')[0], type);
                                        }
                                    }}
                                />
                            </label>
                        )}
                        {selectedDataset && (
                            <button
                                onClick={() => handleDeleteDataset(selectedDataset.id)}
                                className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-6 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.dataset_name')}</label>
                            <input
                                type="text"
                                value={selectedDataset ? selectedDataset.name : newDataset.name}
                                onChange={(e) => selectedDataset ? setSelectedDataset({ ...selectedDataset, name: e.target.value }) : setNewDataset({ ...newDataset, name: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                placeholder={t('admin.fields.dataset_name_placeholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.data_type')}</label>
                            <select
                                value={selectedDataset ? selectedDataset.data_type : newDataset.data_type}
                                onChange={(e) => selectedDataset ? setSelectedDataset({ ...selectedDataset, data_type: e.target.value }) : setNewDataset({ ...newDataset, data_type: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold"
                            >
                                <option value="text">{t('admin.data_types.text')}</option>
                                <option value="json">{t('admin.data_types.json')}</option>
                                <option value="csv">{t('admin.data_types.csv')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.dataset_content')}</label>
                        <textarea
                            value={selectedDataset ? selectedDataset.content : newDataset.content}
                            onChange={(e) => selectedDataset ? setSelectedDataset({ ...selectedDataset, content: e.target.value }) : setNewDataset({ ...newDataset, content: e.target.value })}
                            className="flex-1 w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono text-sm leading-relaxed resize-none h-64 shadow-inner"
                            placeholder={t('admin.fields.grounding_placeholder')}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={selectedDataset ? handleUpdateDataset : handleCreateDataset}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Database className="w-5 h-5" /> {selectedDataset ? t('admin.actions.save_changes') : t('admin.actions.create_dataset')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
