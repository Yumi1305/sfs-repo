import { supabase } from '../lib/supabase';

class MaterialsService {
  
  static async submitMaterial(userId, materialData) {
    try {
      let fileUrl = materialData.file 
        ? await this.uploadFile(userId, materialData.file, 'pdfs')
        : null;
      
      let thumbnailUrl = materialData.thumbnailFile
        ? await this.uploadFile(userId, materialData.thumbnailFile, 'thumbnails')
        : null;
      
      const { data, error } = await supabase
        .from('study_materials')
        .insert({
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
        })
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
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('study-materials')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('study-materials')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  }
  
  static async getApprovedMaterials(filters = {}) {
    let query = supabase
      .from('study_materials')
      .select('*')
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });
    
    if (filters.subjects?.length) {
      query = query.contains('subjects', filters.subjects);
    }
    if (filters.difficulties?.length) {
      query = query.contains('difficulties', filters.difficulties);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  static async getPendingMaterials() {
    const { data, error } = await supabase
      .from('study_materials')
      .select(`*, user_profiles:user_id (full_name, email, display_name)`)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  static async approveMaterial(materialId, reviewerNotes = null) {
    const { data, error } = await supabase
      .from('study_materials')
      .update({ 
        status: 'approved', 
        reviewed_at: new Date().toISOString(), 
        reviewer_notes: reviewerNotes 
      })
      .eq('id', materialId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  static async rejectMaterial(materialId, reviewerNotes = null) {
    const { data, error } = await supabase
      .from('study_materials')
      .update({ 
        status: 'rejected', 
        reviewed_at: new Date().toISOString(), 
        reviewer_notes: reviewerNotes 
      })
      .eq('id', materialId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // ========== UPVOTE METHODS ==========

  /**
   * Add an upvote for a material
   */
  static async addUpvote(userId, materialId) {
    const { data, error } = await supabase
      .from('material_upvotes')
      .insert({
        user_id: userId,
        material_id: materialId
      })
      .select()
      .single();
    
    if (error) {
      // Handle duplicate upvote gracefully
      if (error.code === '23505') {
        console.log('User has already upvoted this material');
        return null;
      }
      throw error;
    }
    return data;
  }

  /**
   * Remove an upvote for a material
   */
  static async removeUpvote(userId, materialId) {
    const { error } = await supabase
      .from('material_upvotes')
      .delete()
      .eq('user_id', userId)
      .eq('material_id', materialId);
    
    if (error) throw error;
    return true;
  }

  /**
   * Check if a user has upvoted a specific material
   */
  static async hasUpvoted(userId, materialId) {
    const { data, error } = await supabase
      .from('material_upvotes')
      .select('id')
      .eq('user_id', userId)
      .eq('material_id', materialId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return !!data;
  }

  /**
   * Get all material IDs that a user has upvoted
   */
  static async getUserUpvotes(userId) {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('material_upvotes')
      .select('material_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(row => row.material_id) || [];
  }

  /**
   * Get upvote count for a specific material
   */
  static async getUpvoteCount(materialId) {
    const { count, error } = await supabase
      .from('material_upvotes')
      .select('*', { count: 'exact', head: true })
      .eq('material_id', materialId);
    
    if (error) throw error;
    return count || 0;
  }

  /**
   * Toggle upvote - adds if not exists, removes if exists
   * Returns { upvoted: boolean, count: number }
   */
  static async toggleUpvote(userId, materialId) {
    const hasVoted = await this.hasUpvoted(userId, materialId);
    
    if (hasVoted) {
      await this.removeUpvote(userId, materialId);
    } else {
      await this.addUpvote(userId, materialId);
    }
    
    const count = await this.getUpvoteCount(materialId);
    
    return {
      upvoted: !hasVoted,
      count
    };
  }
}

export default MaterialsService;