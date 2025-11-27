// materialsService.js - Service for handling study material submissions
import { supabase } from '../lib/supabase';

export class MaterialsService {
  
  /**
   * Submit a new study material for admin review
   * Materials are stored with 'pending' status until approved
   */
  static async submitMaterial(userId, materialData) {
    try {
      console.log('Submitting material:', { userId, materialData });
      
      // If there's a file (PDF), upload it first
      let fileUrl = null;
      if (materialData.file) {
        fileUrl = await this.uploadFile(userId, materialData.file);
      }
      
      // Prepare the material record
      const record = {
        user_id: userId,
        type: materialData.type,
        title: materialData.title,
        url: materialData.url || fileUrl,
        file_url: fileUrl,
        description: materialData.description || null,
        subjects: materialData.subjects,
        difficulties: materialData.difficulties,
        status: 'pending', // pending, approved, rejected
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewer_notes: null
      };
      
      console.log('Inserting material record:', record);
      
      const { data, error } = await supabase
        .from('study_materials')
        .insert(record)
        .select()
        .single();
      
      if (error) {
        console.error('Error submitting material:', error);
        throw error;
      }
      
      console.log('Material submitted successfully:', data);
      return data;
      
    } catch (error) {
      console.error('Error in submitMaterial:', error);
      throw error;
    }
  }
  
  /**
   * Upload a PDF file to Supabase Storage
   */
  static async uploadFile(userId, file) {
    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      console.log('Uploading file:', fileName);
      
      const { data, error } = await supabase.storage
        .from('study-materials')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('study-materials')
        .getPublicUrl(fileName);
      
      console.log('File uploaded, URL:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }
  
  /**
   * Get all approved materials (for display on the main page)
   */
  static async getApprovedMaterials(filters = {}) {
    try {
      let query = supabase
        .from('study_materials')
        .select('*')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false });
      
      // Apply filters if provided
      if (filters.subjects && filters.subjects.length > 0) {
        query = query.contains('subjects', filters.subjects);
      }
      
      if (filters.difficulties && filters.difficulties.length > 0) {
        query = query.contains('difficulties', filters.difficulties);
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching approved materials:', error);
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Error in getApprovedMaterials:', error);
      throw error;
    }
  }
  
  /**
   * Get pending materials (for admin review)
   */
  static async getPendingMaterials() {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select(`
          *,
          user_profiles:user_id (
            full_name,
            email,
            display_name
          )
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching pending materials:', error);
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Error in getPendingMaterials:', error);
      throw error;
    }
  }
  
  /**
   * Approve a material (admin only)
   */
  static async approveMaterial(materialId, reviewerNotes = null) {
    try {
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
      
      if (error) {
        console.error('Error approving material:', error);
        throw error;
      }
      
      return data;
      
    } catch (error) {
      console.error('Error in approveMaterial:', error);
      throw error;
    }
  }
  
  /**
   * Reject a material (admin only)
   */
  static async rejectMaterial(materialId, reviewerNotes = null) {
    try {
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
      
      if (error) {
        console.error('Error rejecting material:', error);
        throw error;
      }
      
      return data;
      
    } catch (error) {
      console.error('Error in rejectMaterial:', error);
      throw error;
    }
  }
  
  /**
   * Get materials submitted by a specific user
   */
  static async getUserSubmissions(userId) {
    try {
      const { data, error } = await supabase
        .from('study_materials')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user submissions:', error);
        throw error;
      }
      
      return data || [];
      
    } catch (error) {
      console.error('Error in getUserSubmissions:', error);
      throw error;
    }
  }
  
  /**
   * Delete a material (only by owner or admin)
   */
  static async deleteMaterial(materialId, userId) {
    try {
      // First check if the material belongs to the user
      const { data: material, error: fetchError } = await supabase
        .from('study_materials')
        .select('user_id, file_url')
        .eq('id', materialId)
        .single();
      
      if (fetchError) throw fetchError;
      
      if (material.user_id !== userId) {
        throw new Error('Unauthorized: You can only delete your own materials');
      }
      
      // Delete the file from storage if it exists
      if (material.file_url) {
        const filePath = material.file_url.split('/').pop();
        await supabase.storage
          .from('study-materials')
          .remove([`${userId}/${filePath}`]);
      }
      
      // Delete the record
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', materialId);
      
      if (error) throw error;
      
      return true;
      
    } catch (error) {
      console.error('Error in deleteMaterial:', error);
      throw error;
    }
  }
}

export default MaterialsService;