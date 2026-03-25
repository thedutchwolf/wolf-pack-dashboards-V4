/**
 * WOLF PACK REAL-TIME SYNC WITH SUPABASE
 * Hybrid Airtable + Supabase system for instant updates
 */

console.log('🚀 Wolf Pack Real-Time Sync Loading...');

class WolfPackRealTime {
    constructor() {
        // Supabase configuration - will be set via environment variables
        this.supabaseUrl = 'https://your-project.supabase.co';
        this.supabaseKey = 'your-anon-key';
        this.supabase = null;
        
        // Airtable backup configuration
        this.airtableBase = 'appFR2ovH2m5XN6I3';
        this.airtableTable = 'Coaching Pipeline';
        this.airtableToken = 'patMqfWUIjB5TmChpZ.f91b8c97c62bb9ade6bfd5f62ee47b14c8dc5a76cbe0b36bb96f3a27f1c8b8e6';
        
        this.currentCoach = 'Unknown';
        this.isConnected = false;
        this.lastSync = null;
        
        this.init();
    }
    
    async init() {
        console.log('🔧 Initializing Wolf Pack Real-Time System...');
        
        try {
            // Import Supabase client (will be loaded via CDN)
            if (typeof createClient !== 'undefined') {
                this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
                await this.setupRealTimeSubscription();
            } else {
                console.log('⚠️ Supabase not available, using Airtable polling fallback');
                this.startAirtablePolling();
            }
            
            this.updateStatus('🟢 Connected', 'sync-connected');
            
        } catch (error) {
            console.error('❌ Real-time init failed:', error);
            this.updateStatus('❌ Connection Failed', 'sync-error');
            this.startAirtablePolling(); // Fallback
        }
    }
    
    async setupRealTimeSubscription() {
        console.log('📡 Setting up Supabase real-time subscription...');
        
        // Listen for all student changes
        this.supabase
            .from('students')
            .on('*', (payload) => {
                this.handleRealTimeUpdate(payload);
            })
            .subscribe();
        
        this.isConnected = true;
        console.log('✅ Real-time subscription active');
    }
    
    handleRealTimeUpdate(payload) {
        console.log('🔄 Real-time update received:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        // Show notification
        if (newRecord && newRecord.updated_by !== this.currentCoach) {
            this.showUpdateNotification(
                `${newRecord.name} moved to ${newRecord.current_stage}`,
                `by ${newRecord.updated_by}`
            );
        }
        
        // Trigger pipeline refresh
        this.refreshPipelineDisplay();
        
        // Update sync status
        this.updateStatus('✅ Synced', 'sync-connected');
        this.lastSync = new Date();
    }
    
    async updateStudent(studentId, updates) {
        console.log('📝 Updating student:', studentId, updates);
        
        try {
            // 1. Update Supabase (instant UI feedback)
            if (this.supabase) {
                await this.supabase
                    .from('students')
                    .update({
                        ...updates,
                        updated_by: this.currentCoach,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', studentId);
            }
            
            // 2. Sync to Airtable (master database)
            await this.syncToAirtable(studentId, updates);
            
            this.updateStatus('✅ Saved', 'sync-connected');
            
        } catch (error) {
            console.error('❌ Update failed:', error);
            this.updateStatus('❌ Save Error', 'sync-error');
        }
    }
    
    async syncToAirtable(studentId, updates) {
        // Find student in Airtable and update
        try {
            const searchResponse = await fetch(
                `https://api.airtable.com/v0/${this.airtableBase}/${encodeURIComponent(this.airtableTable)}?filterByFormula={Student ID}="${studentId}"`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.airtableToken}`
                    }
                }
            );
            
            const searchData = await searchResponse.json();
            
            if (searchData.records && searchData.records.length > 0) {
                const recordId = searchData.records[0].id;
                
                await fetch(
                    `https://api.airtable.com/v0/${this.airtableBase}/${encodeURIComponent(this.airtableTable)}/${recordId}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${this.airtableToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            fields: {
                                'Current Stage': updates.current_stage || updates.stage,
                                'Last Updated': new Date().toISOString(),
                                'Updated By': this.currentCoach
                            }
                        })
                    }
                );
                
                console.log('✅ Synced to Airtable');
            }
            
        } catch (error) {
            console.error('⚠️ Airtable sync failed:', error);
        }
    }
    
    startAirtablePolling() {
        console.log('📊 Starting Airtable polling fallback...');
        
        let lastHash = '';
        
        const pollAirtable = async () => {
            try {
                const response = await fetch(
                    `https://api.airtable.com/v0/${this.airtableBase}/${encodeURIComponent(this.airtableTable)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.airtableToken}`
                        }
                    }
                );
                
                if (response.ok) {
                    const data = await response.json();
                    const currentHash = JSON.stringify(data.records.map(r => ({
                        id: r.id,
                        name: r.fields['Student Name'],
                        stage: r.fields['Current Stage']
                    }))).substr(0, 100);
                    
                    if (lastHash && currentHash !== lastHash) {
                        console.log('🔄 Airtable change detected');
                        this.refreshPipelineDisplay();
                        this.showUpdateNotification('Pipeline updated', 'from Airtable');
                    }
                    
                    lastHash = currentHash;
                    this.updateStatus('🔄 Polling', 'sync-saving');
                }
                
            } catch (error) {
                console.error('❌ Polling failed:', error);
                this.updateStatus('❌ Error', 'sync-error');
            }
        };
        
        // Poll every 8 seconds
        setInterval(pollAirtable, 8000);
        pollAirtable(); // Initial poll
    }
    
    showUpdateNotification(title, subtitle) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                font-weight: bold;
                box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
                z-index: 99999;
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
            ">
                <div style="font-size: 16px;">🔄 ${title}</div>
                <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">${subtitle}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
    
    refreshPipelineDisplay() {
        // Trigger pipeline refresh
        if (typeof loadFromAirtable === 'function') {
            loadFromAirtable();
        }
        
        // Visual feedback
        const body = document.body;
        body.style.transition = 'background-color 0.3s';
        body.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
        setTimeout(() => {
            body.style.backgroundColor = '';
        }, 300);
    }
    
    updateStatus(text, className) {
        const indicator = document.getElementById('syncIndicator');
        if (indicator) {
            indicator.textContent = text;
            indicator.className = className;
        }
        
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            lastUpdated.textContent = `Last: ${new Date().toLocaleTimeString()}`;
        }
    }
    
    setCoach(coachName) {
        this.currentCoach = coachName;
        console.log('👤 Coach set:', coachName);
    }
}

// Global instance
window.wolfPackRealTime = new WolfPackRealTime();

// Global functions for dashboard integration
window.updateStudentStage = function(studentId, newStage) {
    return window.wolfPackRealTime.updateStudent(studentId, {
        current_stage: newStage,
        stage: newStage
    });
};

window.setCurrentCoach = function(coachName) {
    window.wolfPackRealTime.setCoach(coachName);
};

console.log('✅ Wolf Pack Real-Time System loaded');