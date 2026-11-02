import { useEffect } from 'react';
import { applyPageMeta } from '../utils/seo';

// Título, descrição e indexação da tela atual (ver src/utils/seo.js)
export default function usePageMeta(key, path) {
    useEffect(() => { applyPageMeta(key, path); }, [key, path]);
}
