import Swal from "sweetalert2";

export const showLoading = (title = "Processing...") => {
    Swal.fire({
        title,
        text: "Please wait a moment...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

export const showSuccess = (message = "Success") => {
    Swal.fire({
        icon: "success",
        title: "Success",
        text: message,
        timer: 2000,
        showConfirmButton: false,
    });
};

export const showError = (message = "Something went wrong") => {
    Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
    });
};

export const confirmAction = ({
    title = "Are you sure?",
    text = "This action cannot be undone.",
    confirmText = "Yes",
}) => {
    return Swal.fire({
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: "Cancel",
    });
};

export const hideLoading = () => {
    return Swal.close();
}
