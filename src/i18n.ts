'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "dashboard_title": "Amazon Admin",
            "dashboard_sub": "Automate your product tracking workflow",
            "manage_categories": "Manage Categories",
            "loading_products": "Loading products...",
            "add_product_title": "Add New Product",
            "url_placeholder": "Paste Amazon Product URL...",
            "add_button": "Add Product",
            "saving": "Saving...",
            "save": "Save",
            "fetch_error": "Failed to scrape",
            "view_page": "View Page",
            "product_list_title": "Managed Products",
            "delete_confirm": "Are you sure you want to delete this product?",
            "no_products": "No products found.",
            "switch_to_pt": "Mudar para Português",
            "switch_to_en": "Switch to English",
            "name_label": "Name",
            "price_label": "Price",
            "category_label": "Category",
            "search_placeholder": "Search products...",
            "status_label": "Status",
            "actions_label": "Actions",
            "active": "Active",
            "archived": "Archived",
            "previous": "Previous",
            "next": "Next",
            "page_info": "Showing {{start}} to {{end}} of {{total}} products",
            "page_current": "Page {{current}} of {{total}}",
            "delete_product": "Delete Product",
            "delete_desc": "Are you sure you want to delete \"{{title}}\"? This action cannot be undone.",
            "cancel": "Cancel",
            "delete": "Delete",
            "edit": "Edit",
            "back_dashboard": "Back to Dashboard",
            "uncategorized": "Uncategorized",
            "manage_categories_sub": "Add or remove product categories",
            "new_category_placeholder": "New category name...",
            "add": "Add",
            "no_categories": "No categories found. Create one above.",
            "delete_category": "Delete Category",
            "delete_category_desc": "Are you sure you want to delete {{name}}? This action cannot be undone.",
            "product_info": "Product Information",
            "product_id": "Product ID",
            "amazon_view": "View on Amazon",
            "new_category_label": "New Category Name",
            "select_category": "Select Category...",
            "image_label": "Image"
        }
    },
    pt: {
        translation: {
            "dashboard_title": "Painel Amazon",
            "dashboard_sub": "Automatize seu fluxo de triagem de produtos",
            "manage_categories": "Gerenciar Categorias",
            "loading_products": "Carregando produtos...",
            "add_product_title": "Adicionar Novo Produto",
            "url_placeholder": "Cole a URL do produto Amazon...",
            "add_button": "Adicionar Produto",
            "saving": "Salvando...",
            "save": "Salvar",
            "fetch_error": "Falha ao buscar dados",
            "view_page": "Ver Página",
            "product_list_title": "Produtos Gerenciados",
            "delete_confirm": "Tem certeza que deseja excluir este produto?",
            "no_products": "Nenhum produto encontrado.",
            "switch_to_pt": "Mudar para Português",
            "switch_to_en": "Switch to English",
            "name_label": "Nome",
            "price_label": "Preço",
            "category_label": "Categoria",
            "search_placeholder": "Pesquisar produtos...",
            "status_label": "Status",
            "actions_label": "Ações",
            "active": "Ativo",
            "archived": "Arquivado",
            "previous": "Anterior",
            "next": "Próximo",
            "page_info": "Exibindo {{start}} a {{end}} de {{total}} produtos",
            "page_current": "Página {{current}} de {{total}}",
            "delete_product": "Excluir Produto",
            "delete_desc": "Tem certeza que deseja excluir \"{{title}}\"? Esta ação não pode ser desfeita.",
            "cancel": "Cancelar",
            "delete": "Excluir",
            "edit": "Editar",
            "back_dashboard": "Voltar ao Início",
            "uncategorized": "Sem categoria",
            "manage_categories_sub": "Adicionar ou remover categorias de produtos",
            "new_category_placeholder": "Nome da nova categoria...",
            "add": "Adicionar",
            "no_categories": "Nenhuma categoria encontrada. Crie uma acima.",
            "delete_category": "Excluir Categoria",
            "delete_category_desc": "Tem certeza que deseja excluir {{name}}? Esta ação não pode ser desfeita.",
            "product_info": "Informações do Produto",
            "product_id": "ID do Produto",
            "amazon_view": "Ver na Amazon",
            "new_category_label": "Nome da Nova Categoria",
            "select_category": "Selecionar Categoria...",
            "image_label": "Imagem"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'pt',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
