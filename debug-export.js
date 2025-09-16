// Debug script for export testing
async function debugExportIssue() {
    console.log('=== Export Debug Test ===');
    
    // Test JSON format
    console.log('\n--- Testing JSON Export ---');
    try {
        const jsonResponse = await fetch('/api/export/toolkit?format=json');
        console.log('JSON Status:', jsonResponse.status);
        console.log('JSON Headers:', Object.fromEntries(jsonResponse.headers.entries()));
        
        const jsonText = await jsonResponse.text();
        console.log('JSON Response length:', jsonText.length);
        
        if (jsonText.startsWith('<!DOCTYPE html>') && jsonText.includes('createHotContext')) {
            console.error('❌ JSON: Got Vite HTML instead of JSON');
        } else if (jsonText.startsWith('{')) {
            console.log('✅ JSON: Got proper JSON response');
        } else {
            console.log('⚠️ JSON: Got unexpected response:', jsonText.substring(0, 100));
        }
    } catch (error) {
        console.error('JSON Error:', error);
    }
    
    // Test HTML format
    console.log('\n--- Testing HTML Export ---');
    try {
        const htmlResponse = await fetch('/api/export/toolkit?format=word');
        console.log('HTML Status:', htmlResponse.status);
        console.log('HTML Headers:', Object.fromEntries(htmlResponse.headers.entries()));
        
        const htmlText = await htmlResponse.text();
        console.log('HTML Response length:', htmlText.length);
        
        if (htmlText.startsWith('<!DOCTYPE html>') && htmlText.includes('createHotContext')) {
            console.error('❌ HTML: Got Vite template instead of export content');
        } else if (htmlText.includes('Pivot-and-Launch PBL Pedagogy Toolkit')) {
            console.log('✅ HTML: Got proper export content');
        } else {
            console.log('⚠️ HTML: Got unexpected response:', htmlText.substring(0, 100));
        }
    } catch (error) {
        console.error('HTML Error:', error);
    }
    
    console.log('\n=== Debug Complete ===');
}

// Run the debug test
debugExportIssue();