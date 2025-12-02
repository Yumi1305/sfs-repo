import { supabase } from '../lib/supabase';

export class MaterialsService {
  
  static async submitMaterial(userId, materialData) {
    try {
      console.log('Submitting material:', { userId, materialData });
      
      let fileUrl = null;
      if (materialData.file) {
        fileUrl = await this.uploadFile(userId, materialData.file, 'pdfs');
      }
      
      let thumbnailUrl = null;
      if (materialData.thumbnailFile) {
        thumbnailUrl = await this.uploadFile(userId, materialData.thumbnailFile, 'thumbnails');
      }
      
      const record = {
        user_id: userId,
        type: materialData.type,
        title: materialData.title,
        url: materialData.url || fileUrl,
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        description: materialData.description || null,
        subjects: materialData.subjects,
        difficulties: materialData.difficulties,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewer_notes: null
      };
      
      const { data, error } = await supabase
        .from('study_materials')
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in submitMaterial:', error);
      throw error;
    }
  }
  
  static async uploadFile(userId, file, folder = 'pdfs') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('study-materials')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('study-materials')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }
  
  static async getApprovedMaterials(userId = null, filters = {}) {
    try {
      let query = supabase
        .from('study_materials')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false });
      
      if (filters.subjects?.length > 0) {
        query = query.contains('subjects', filters.subjects);
      }
      if (filters.difficulties?.length > 0) {
        query = query.contains('difficulties', filters.difficulties);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      
      const { data: materials, error } = await query;
      if (error) throw error;
      
      if (userId && materials?.length > 0) {
        const { data: favorites } = await supabase
          .from('user_favorited_materials')
          .select('material_id')
          .eq('user_id', userId);
        
        const favoritedIds = new Set(favorites?.map(f => f.material_id) || []);
        return materials.map(m => ({ ...m, is_favorited: favoritedIds.has(m.id) }));
      }
      
      return materials || [];
    } catch (error) {
      console.error('Error in getApprovedMaterials:', error);
      throw error;
    }
  }
  
  static async getPendingMaterials() {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select(`*, user_profiles:user_id (full_name, email, display_name)`)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getPendingMaterials:', error);
      throw error;
    }
  }
  
  static async approveMaterial(materialId, reviewerNotes = null) {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewer_notes: reviewerNotes })
        .eq('id', materialId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in approveMaterial:', error);
      throw error;
    }
  }
  
  static async rejectMaterial(materialId, reviewerNotes = null) {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewer_notes: reviewerNotes })
        .eq('id', materialId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in rejectMaterial:', error);
      throw error;
    }
  }
  
  static async getUserFavoritedMaterials(userId) {
    try {
      const { data, error } = await supabase
        .from('user_favorited_materials')
        .select(`material_id, favorited_at, study_materials (*)`)
        .eq('user_id', userId)
        .order('favorited_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(item => ({ ...item.study_materials, favorited_at: item.favorited_at, is_favorited: true }));
    } catch (error) {
      console.error('Error in getUserFavoritedMaterials:', error);
      throw error;
    }
  }
  
  static async addToFavorites(userId, materialId) {
    try {
      const { error } = await supabase
        .from('user_favorited_materials')
        .insert({ user_id: userId, material_id: materialId, favorited_at: new Date().toISOString() });
      
      if (error && error.code !== '23505') throw error;
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }
  
  static async removeFromFavorites(userId, materialId) {
    try {
      const { error } = await supabase
        .from('user_favorited_materials')
        .delete()
        .eq('user_id', userId)
        .eq('material_id', materialId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }
}

export default MaterialsService;