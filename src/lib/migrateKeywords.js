import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { generateKeywords } from './keywords';

export async function runKeywordMigration() {
  console.log("Starting keyword migration...");
  try {
    const snapshot = await getDocs(collection(db, 'ideas'));
    let updatedCount = 0;
    
    // Process sequentially to avoid rate limits on free tier
    for (const document of snapshot.docs) {
      const data = document.data();
      
      // Only migrate if it doesn't already have keywords
      if (!data.keywords || data.keywords.length === 0) {
        const keywords = generateKeywords(
          data.title, 
          data.problem, 
          data.solution, 
          data.targetUsers, 
          data.monetization, 
          ...(data.tags || [])
        );
        
        await updateDoc(doc(db, 'ideas', document.id), { keywords });
        console.log(`Migrated: ${data.title}`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Migration complete. Updated ${updatedCount} documents.`);
    alert(`Migration complete. Updated ${updatedCount} documents.`);
    return updatedCount;
  } catch (error) {
    console.error("Migration failed:", error);
    alert("Migration failed. Check console.");
  }
}
