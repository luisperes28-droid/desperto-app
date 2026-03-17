import React, { useState } from 'react';
import { Info, X, CheckCircle, AlertTriangle } from 'lucide-react';

const buildDate = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'unknown';
const gitCommit = typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'unknown';
const gitCommitDate = typeof __GIT_COMMIT_DATE__ !== 'undefined' ? __GIT_COMMIT_DATE__ : 'unknown';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isStale(): boolean {
  try {
    const build = new Date(buildDate);
    const now = new Date();
    const diffHours = (now.getTime() - build.getTime()) / (1000 * 60 * 60);
    return diffHours > 72;
  } catch {
    return false;
  }
}

export function DeployInfo() {
  const [open, setOpen] = useState(false);
  const stale = isStale();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-50 p-2 rounded-full bg-gray-800/70 text-white hover:bg-gray-800 transition-colors"
        title="Informacao do Deploy"
      >
        {stale ? (
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        ) : (
          <Info className="w-4 h-4" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-lg">Deploy Info</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {stale && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Deploy desatualizado!</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Este build tem mais de 72h. Verifica se o GitHub sync e o Netlify deploy estao corretos.
                    </p>
                  </div>
                </div>
              )}

              {!stale && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-emerald-800">Deploy atualizado</p>
                </div>
              )}

              <div className="space-y-3">
                <Row label="Git Commit" value={gitCommit} mono />
                <Row label="Commit Date" value={formatDate(gitCommitDate)} />
                <Row label="Build Date" value={formatDate(buildDate)} />
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Para verificar: compara o commit acima com o ultimo commit no GitHub e com o deploy na Netlify.
                  Se nao coincidirem, faz "Clear cache and deploy site" na Netlify.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono bg-gray-100 px-2 py-0.5 rounded' : ''}`}>
        {value}
      </span>
    </div>
  );
}
