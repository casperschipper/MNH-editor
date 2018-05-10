import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpEventType, HttpResponse, HttpRequest } from '@angular/common/http';
import { RCExpoModel } from '../shared/RCExpoModel';
import { RCExpositionDeserializer } from '../shared/rcexposition';
import * as FileSaver from 'file-saver';
import * as Editor from '../shared/rcmde';
import { ConvertDocService } from '../shared/convert-doc.service';
import { Backend } from '../shared/Backend';
import * as Utils from '../shared/utils';

@Component({
    selector: 'app-doc-uploader',
    templateUrl: './doc-uploader.component.html',
    styleUrls: ['./doc-uploader.component.css'],
    providers: [ConvertDocService]
})
export class DocUploaderComponent implements OnInit {
    selectedFile: File = null;
    selectedJson: File = null;
    selectedExportFormat: string = "docx";
    fileUploadStatus: string = null;

    allowedTypes: string[] = ['docx', 'htm', 'html', 'odt', 'tex', 'txt', 'md', 'markdown'];

    constructor(
        private http: HttpClient,
        private rcExpoModel: RCExpoModel,
        private convertDocService: ConvertDocService) { }

    ngOnInit() {
    }

    formattedTypes() {
        return this.allowedTypes.join(', ');
    }


    onFileSelected(event) {
        this.selectedFile = <File>event.target.files[0];
        if (!Utils.checkTypeUsingFilename(this.selectedFile.name, this.allowedTypes)) {
            alert('Sorry, we do not support the filetype of "' + this.selectedFile.name + '"\n\nSupported filetypes are: ' + this.formattedTypes());
        }
    }

    onJsonSelected(event) {
        this.selectedJson = <File>event.target.files[0];
        if (!Utils.checkTypeUsingFilename(this.selectedJson.name, ['.json'])) {
            alert('This is not an exposition, please provide .json or use import external format');
        }
    }

    onDocUpload() {
        //TODO check weird filenames!
        // check by extension:

        let importURL;
        let fileField = "convertFile";
        if (Backend.useRC) {
            fileField = "file";
            importURL = Backend.rcImport + "?research=" + this.rcExpoModel.exposition.id + "&weave=" + this.rcExpoModel.exposition.currentWeave;
        } else {
            importURL = Backend.import;
        }

        let filename = "file" + "." + (this.selectedFile.name.split(".")[1]);

        const fd = new FormData();
        //        fd.append('convertFile', this.selectedFile, this.selectedFile.name);
        fd.append(fileField, this.selectedFile, filename);


        const req = new HttpRequest('POST', importURL, fd, {
            reportProgress: true,
        });

        this.http.request(req).subscribe(event => {
            // Via this API, you get access to the raw event stream.
            // Look for upload progress events.
            if (event.type === HttpEventType.UploadProgress) {
                // This is an upload progress event. Compute and show the % done:
                this.fileUploadStatus = Math.round(100 * event.loaded / event.total) + '%';
            } else if (event instanceof HttpResponse) {
                this.fileUploadStatus = 'done';
                window.setTimeout(() => { this.fileUploadStatus = null }, 1000);
                console.log(event);
                console.log(event);
                this.onDocImportResult(event.body);
            }
        });

        this.rcExpoModel.mde.render();
    }

    onDocImportResult(result) {
        if (Backend.useRC) {
            console.log("import result:");
            console.log(result);
            this.rcExpoModel.syncModelWithRC(() => this.rcExpoModel.mde.importDocJSON(result));
        } else {
            this.rcExpoModel.mde.importDocJSON(result);
            this.rcExpoModel.mde.saved = false;
        }
    }

    onJsonImport() {
        if (!this.selectedJson) {
            alert('please select json file first');
            return;
        }
        let reader = new FileReader();
        reader.onload = (e) => {
            let expositionJSON = JSON.parse(reader.result);
            //  console.log(expositionJSON);
            let exposition = RCExpositionDeserializer.restoreObject(expositionJSON);
            //  console.log(exposition);
            exposition.media.forEach(m => m.html = undefined);
            this.rcExpoModel.exposition = exposition;
            this.rcExpoModel.mde.exposition = exposition;
            //          console.log(exposition.markdownInput);
            this.rcExpoModel.mde.value(exposition.markdownInput);
            this.rcExpoModel.mde.render();
        };


        reader.readAsText(this.selectedJson);
    }



    jsonDownload() {
        var blob = new Blob([this.rcExpoModel.exposition.serialize()], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(blob, "exposition.json");
    }

    onDocTypeChange(value) {
        this.selectedExportFormat = value;
    }

    otherFormatDownload() {
        let exposition = this.rcExpoModel.exposition;
        let markdownString: string = exposition.asMarkdown();
        console.log('arguments:', markdownString, this.selectedExportFormat);
        this.convertDocService.convert(markdownString, this.selectedExportFormat);
    }
}

/*

example code 
function saveJSON() {
    var blob = new Blob([exposition.serialize()], {type: "text/plain;charset=utf-8"});
    saveAs(blob,"exposition.json");
}


var fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', function(e) {
    var file = fileInput.files[0];
    
    var reader = new FileReader();
    
    reader.onload = function(e) {
  var expositionJSON = JSON.parse(reader.result);
//  console.log(expositionJSON);
  exposition = RCExpositionDeserializer.restoreObject(expositionJSON);
//  console.log(exposition);
  exposition.renderResponsive();
    };
    
    reader.readAsText(file);  

});
*/
