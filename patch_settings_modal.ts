import fs from 'fs';

let content = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');

const replacement = `{isMasterAdmin && (
            <>
              {/* Section 1: Backup / Export */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#FF4E00]" />
                      Sao lưu dữ liệu (xuất file)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tải bản sao lưu toàn bộ dữ liệu về máy tính/điện thoại cá nhân để cất giữ an toàn.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Export JSON button */}
                  <button
                    onClick={exportBackupJson}
                    className="flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold p-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Sao lưu dữ liệu (xuất file JSON)</span>
                  </button>

                  {/* Export Excel / CSV button */}
                  <button
                    onClick={exportClientsCsv}
                    className="flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                    <span>Xuất danh sách hội viên (Excel/CSV)</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Restore / Import */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-[#4F46E5]" />
                    Khôi phục dữ liệu (nhập từ file)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chọn file sao lưu JSON đã tải về trước đó để khôi phục lại toàn bộ dữ liệu.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold p-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isImporting ? 'Đang xử lý khôi phục...' : 'Khôi phục dữ liệu (nhập file JSON)'}</span>
                  </button>
                </div>

                {/* Status Feedback */}
                {importStatus.type && (
                  <div className={\`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 \${
                    importStatus.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }\`}>
                    {importStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{importStatus.message}</span>
                  </div>
                )}
              </div>
            </>
          )}`;

const regex = /{\/\* Section 1: Backup \/ Export \*\/}[\s\S]*?<\/\div>[\s]*}{\/\* Section 3:/;

content = content.replace(regex, replacement + '\n\n          {/* Section 3:');
fs.writeFileSync('src/components/SettingsModal.tsx', content);
