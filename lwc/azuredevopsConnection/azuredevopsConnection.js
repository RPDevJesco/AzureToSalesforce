import { LightningElement, api, track } from 'lwc';
import getDetailedWorkItems from '@salesforce/apex/AzureConnection.getDetailedWorkItems';
import getWorkItemComments from '@salesforce/apex/AzureConnection.getWorkItemComments';
import addWorkItemComment from '@salesforce/apex/AzureConnection.addWorkItemComment';
import updateWorkItemState from '@salesforce/apex/AzureConnection.updateWorkItemState';

export default class AzureDevOpsConnection extends LightningElement {
    @api setOrganizationName;
    @api setProjectName;
    @api setUserName;
    @api setPersonalAccessToken;

    @track workItems = [];
    @track isModalOpen = false;
    @track currentComments = [];
    @track statesOptions = [
        { label: 'New', value: 'New' },
        { label: 'Active', value: 'Active' },
        { label: 'Resolved', value: 'Resolved' },
        { label: 'Closed', value: 'Closed' },
        { label: 'Removed', value: 'Removed' }
    ];

    currentWorkItemId;

    connectedCallback() {
        getDetailedWorkItems({ setOrganizationName: this.setOrganizationName, setProjectName: this.setProjectName, setUserName: this.setUserName, setPersonalAccessToken: this.setPersonalAccessToken })
            .then(result => {
                this.workItems = JSON.parse(JSON.stringify(result));
                this.workItems.forEach(item => item.showAddComment = false);
            })
            .catch(error => {
                console.error('Error fetching work items', error);
            });
    }

    openModal(event) {
        this.currentWorkItemId = event.currentTarget.dataset.id;
        getWorkItemComments({ setOrganizationName: this.setOrganizationName, setProjectName: this.setProjectName, setUserName: this.setUserName, setPersonalAccessToken: this.setPersonalAccessToken, workItemId: this.currentWorkItemId })
            .then(result => {
                this.currentComments = JSON.parse(JSON.stringify(result));
                this.isModalOpen = true;
            })
            .catch(error => {
                console.error('Error fetching comments', error);
            });
    }

    closeModal() {
        this.isModalOpen = false;
        this.currentComments = [];
    }

    toggleAddComment(event) {
        const workItemId = event.currentTarget.dataset.id;
        const workItemIndex = this.workItems.findIndex(item => item.Id == workItemId);
        if (workItemIndex !== -1) {
            const clonedWorkItem = { ...this.workItems[workItemIndex] };
            clonedWorkItem.showAddComment = event.target.checked;
            this.workItems[workItemIndex] = clonedWorkItem;
        }
    }

    handleCommentChange(event) {
        const workItemId = event.currentTarget.dataset.id;
        const workItem = this.workItems.find(item => item.Id == workItemId);
        workItem.newComment = event.target.value;
    }

    postComment(event) {
        const workItemId = event.currentTarget.dataset.id;
        const workItem = this.workItems.find(item => item.Id == workItemId);
        addWorkItemComment({ setOrganizationName: this.setOrganizationName, setProjectName: this.setProjectName, setUserName: this.setUserName, setPersonalAccessToken: this.setPersonalAccessToken, workItemId: workItemId, commentText: workItem.newComment })
            .then(() => {
                alert('Comment posted successfully');
                workItem.showAddComment = false;
                workItem.newComment = '';
            })
            .catch(error => {
                console.error('Error posting comment', error);
            });
    }

    handleStateChange(event) {
        const workItemId = event.currentTarget.dataset.id;
        const workItem = this.workItems.find(item => item.Id == workItemId);
        workItem.newState = event.target.value;
    }

    updateState(event) {
        const workItemId = event.currentTarget.dataset.id;
        const workItem = this.workItems.find(item => item.Id == workItemId);

        updateWorkItemState({
            setOrganizationName: this.setOrganizationName,
            setProjectName: this.setProjectName,
            setUserName: this.setUserName,
            setPersonalAccessToken: this.setPersonalAccessToken,
            workItemId: workItemId,
            newState: workItem.newState
        })
            .then(() => {
                alert('State updated successfully');
                // Reload or refresh the work items or just update the specific work item's state in the UI.
            })
            .catch(error => {
                console.error('Error updating state', error);
            });
    }
}