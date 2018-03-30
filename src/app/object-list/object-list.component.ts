import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SortablejsOptions } from 'angular-sortablejs';

import { RCExpoModel } from '../shared/RCExpoModel';
import { RCMDE, insertMediaToken, insertMedia } from '../shared/rcmde';
import { RCObject, RCImage, RCAudio, RCSvg, RCPdf, RCVideo } from '../shared/rcexposition';


@Component({
    selector: 'app-object-list',
    templateUrl: './object-list.component.html',
    styleUrls: ['./object-list.component.css'],
})
export class ObjectListComponent implements OnInit {
    imageUri: string = null;
    selectedObject: RCObject = null;

    @Output() onObjectWasChosen = new EventEmitter();

    // member object to deal with single vs double click
    dblClickCtrl = {
        timer: <number>2,
        prevent: <boolean>false,
        delay: <number>60
    };

    eventOptions = {
        onUpdate: (event) => {
            
        }
    }

    constructor(public rcExpoModel: RCExpoModel) { }

    createImageTool() {
        let imageName = 'image' + this.rcExpoModel.exposition.media.length;
        let imageObject = new RCImage(imageName, this.imageUri, 'myClass', null, null);

        this.rcExpoModel.exposition.addObject(imageObject);
        this.selectedObject = imageObject;
        // this.rcExpoModel.exposition.addObject(imageObject, 0);
    }

    createAudioTool() {
        let imageName = 'audio' + this.rcExpoModel.exposition.media.length;
        // name: string, url: string, autoplay, loop, userClass, pxWidth?: number, pxHeight?: number

        let audioObject = new RCAudio(imageName, this.imageUri, false, false, 'myClass', null, null);

        this.rcExpoModel.exposition.addObject(audioObject);
        this.selectedObject = audioObject;    
    }

    onSelect(rcobject: RCObject) {
        if (rcobject) {
            let id = rcobject.id;
            // only process click, if there was not a single click
            this.dblClickCtrl.timer = setTimeout(() => {
                if (!this.dblClickCtrl.prevent) {
                    this.selectedObject = rcobject;
                } else {
                    this.dblClickCtrl.prevent = false;
                }
            }, this.dblClickCtrl.delay);
        }


    }

    onDoubleClick(rcobject: RCObject) {
        console.log('rcobject',rcobject);

        if (rcobject) {
            let id = rcobject.id;
            // detected double click, don't process single click;
            clearTimeout(this.dblClickCtrl.timer);
            this.dblClickCtrl.prevent = true;
            // insert rcobject in mde
            let editor: RCMDE = this.rcExpoModel.mde;
            insertMedia(editor,rcobject.name);
            this.onObjectWasChosen.emit();
        }
    }

    isObjectSelected(rcobject: RCObject) {
        if (this.selectedObject) {
            return this.selectedObject.id === rcobject.id;
        }
        return false;
    }

    getCurrentSelection() {
        return this.selectedObject;
    }

    toolType(obj) {
        return obj.constructor.name;
    }

    removeAll() {
        this.rcExpoModel.exposition.media = [];
    }

    ngOnChanges() {
        // check if rcobject was removed
        if (!this.rcExpoModel.exposition.getObjectWithID(this.selectedObject.id)) {
            this.selectedObject = this.rcExpoModel.exposition.media[0];
        }
    }

    whenOpened() {
        if (this.rcExpoModel.exposition.media.length > 0) {
            this.selectedObject = this.rcExpoModel.exposition.media[0];
        }
    }

    onChangedObject(identity: number) {
        let newObject = this.rcExpoModel.exposition.getObjectWithID(identity);
        console.log('newobject id',identity);
        if (newObject) {
            console.log('the object',newObject);
            this.selectedObject = this.rcExpoModel.exposition.getObjectWithID(identity);
        }
    }

    objectWasRemoved(removedObjectId: number) {
        if (this.selectedObject.id === removedObjectId) {
            this.selectedObject = this.rcExpoModel.exposition.media[0];
        }
    }

    trashObject(rcObject) {
        this.rcExpoModel.exposition.removeObjectWithID(rcObject.id);
    }

    ngOnInit() {
        if (this.rcExpoModel.exposition.media.length > 0) {
            this.selectedObject = this.rcExpoModel.exposition.media[0];
        }
    }


}
